import Decimal from 'decimal.js';
import {
  TipoImposto,
  calcularIcmsSt,
  SIMPLES_NACIONAL_ANEXO_I,
  SIMPLES_NACIONAL_ANEXO_III,
  type SimplesNacionalFaixa,
} from '@contabilita/shared';
import { TaxCalculationStrategy, TaxCalculationInput, TaxCalculationContext, TaxLineResult } from './tax-calculation.strategy';

const ANEXO_MAP: Record<string, SimplesNacionalFaixa[]> = {
  I: SIMPLES_NACIONAL_ANEXO_I,
  III: SIMPLES_NACIONAL_ANEXO_III,
};

/**
 * Calculo de impostos para empresas do Simples Nacional.
 * No Simples, os impostos sao unificados no DAS.
 *
 * Quando RBT12 e Anexo sao fornecidos no contexto, calcula a aliquota efetiva
 * real. Caso contrario, usa estimativa simplificada.
 *
 * ICMS-ST e calculado separadamente em operacoes interestaduais quando
 * o NCM esta na tabela de substituicao tributaria.
 */
export class SimplesNacionalStrategy implements TaxCalculationStrategy {
  calculateItemTaxes(input: TaxCalculationInput, context?: TaxCalculationContext): TaxLineResult[] {
    const results: TaxLineResult[] = [];
    const { valorTotal, isServico, ncm } = input;

    if (isServico) {
      // ISS — calcula aliquota efetiva se RBT12 disponivel
      let aliquota: Decimal;
      if (context?.rbt12 && context.anexoSimples) {
        aliquota = new Decimal(this.calcAliquotaEfetiva(context.rbt12.toNumber(), context.anexoSimples));
      } else if (context?.aliquotaIssMunicipal) {
        aliquota = context.aliquotaIssMunicipal;
      } else {
        aliquota = new Decimal('0.03'); // Estimativa Anexo III faixa 1
      }

      results.push({
        tipo: TipoImposto.ISS,
        baseCalculo: valorTotal.toString(),
        aliquota: aliquota.toString(),
        valor: valorTotal.times(aliquota).toDecimalPlaces(2).toString(),
      });
    }

    // No Simples, PIS/COFINS/ICMS estao embutidos no DAS
    // Registramos com aliquota zero para rastreabilidade
    results.push({
      tipo: TipoImposto.PIS,
      baseCalculo: valorTotal.toString(),
      aliquota: '0',
      valor: '0',
    });
    results.push({
      tipo: TipoImposto.COFINS,
      baseCalculo: valorTotal.toString(),
      aliquota: '0',
      valor: '0',
    });

    // ICMS-ST — mesmo no Simples, ST e cobrado separadamente
    if (!isServico && context?.ufOrigem && context?.ufDestino && context.ufOrigem !== context.ufDestino && ncm) {
      const ncm4 = ncm.substring(0, 4);
      const valorIpi = context.valorIpi?.toNumber() ?? 0;
      const st = calcularIcmsSt({
        valorProduto: valorTotal.toNumber(),
        valorIpi,
        ufOrigem: context.ufOrigem,
        ufDestino: context.ufDestino,
        ncm4,
      });
      if (st.valorIcmsSt > 0) {
        results.push({
          tipo: TipoImposto.ICMS,
          subtipo: 'ST',
          baseCalculo: st.baseCalculoSt.toString(),
          aliquota: st.mvaAplicada.toString(),
          valor: st.valorIcmsSt.toString(),
        });
      }
    }

    return results;
  }

  /**
   * Calcula aliquota efetiva do Simples Nacional.
   * Formula: (RBT12 * aliquota_nominal - deducao) / RBT12
   */
  private calcAliquotaEfetiva(rbt12: number, anexo: string): number {
    const tabela = ANEXO_MAP[anexo];
    if (!tabela || rbt12 <= 0) return 0.04;

    const faixa = tabela.find((f) => rbt12 <= f.ate) ?? tabela[tabela.length - 1];
    const efetiva = (rbt12 * faixa.aliquota - faixa.deducao) / rbt12;
    return Math.max(0, efetiva);
  }
}
