import Decimal from 'decimal.js';
import { TipoImposto } from '@contabilita/shared';
import { TaxCalculationStrategy, TaxCalculationInput, TaxLineResult } from './tax-calculation.strategy';

/**
 * Calculo de impostos para empresas do Simples Nacional.
 * No Simples, os impostos sao unificados no DAS.
 * Itens individuais nao tem ICMS/PIS/COFINS destacados separadamente
 * (exceto ICMS-ST em operacoes interestaduais).
 *
 * Aliquota efetiva depende da receita bruta dos ultimos 12 meses (RBT12).
 * Aqui usamos uma aliquota simplificada para calculo estimado.
 */
export class SimplesNacionalStrategy implements TaxCalculationStrategy {
  calculateItemTaxes(input: TaxCalculationInput): TaxLineResult[] {
    const results: TaxLineResult[] = [];
    const { valorTotal, isServico } = input;

    if (isServico) {
      // ISS no Simples - incluido no DAS, mas destacado para controle
      // Aliquota efetiva varia de 2% a 5% conforme Anexo III/IV/V
      const aliquota = new Decimal('0.03'); // Estimativa Anexo III
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

    return results;
  }
}
