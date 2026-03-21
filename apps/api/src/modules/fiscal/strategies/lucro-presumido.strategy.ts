import Decimal from 'decimal.js';
import { TipoImposto, getAliquotaInterestadual, ICMS_ALIQUOTA_INTERNA, calcularIcmsSt, calcularDifal } from '@contabilita/shared';
import { TaxCalculationStrategy, TaxCalculationInput, TaxCalculationContext, TaxLineResult } from './tax-calculation.strategy';

/**
 * Calculo de impostos para Lucro Presumido.
 *
 * PIS: 0.65% cumulativo
 * COFINS: 3% cumulativo
 * ICMS: aliquota estadual (usa contexto UF quando disponivel)
 * ISS: aliquota municipal (usa contexto quando disponivel)
 * ICMS-ST: quando NCM esta na tabela de substituicao tributaria
 * DIFAL: para operacoes interestaduais B2C
 * IRPJ/CSLL: calculados trimestralmente na apuracao
 */
export class LucroPresumidoStrategy implements TaxCalculationStrategy {
  private readonly ALIQUOTA_PIS = new Decimal('0.0065');
  private readonly ALIQUOTA_COFINS = new Decimal('0.03');
  private readonly ALIQUOTA_ISS_PADRAO = new Decimal('0.05');

  calculateItemTaxes(input: TaxCalculationInput, context?: TaxCalculationContext): TaxLineResult[] {
    const results: TaxLineResult[] = [];
    const { valorTotal, isServico, ncm } = input;

    // PIS cumulativo
    results.push({
      tipo: TipoImposto.PIS,
      baseCalculo: valorTotal.toString(),
      aliquota: this.ALIQUOTA_PIS.toString(),
      valor: valorTotal.times(this.ALIQUOTA_PIS).toDecimalPlaces(2).toString(),
    });

    // COFINS cumulativo
    results.push({
      tipo: TipoImposto.COFINS,
      baseCalculo: valorTotal.toString(),
      aliquota: this.ALIQUOTA_COFINS.toString(),
      valor: valorTotal.times(this.ALIQUOTA_COFINS).toDecimalPlaces(2).toString(),
    });

    if (isServico) {
      // ISS — usa aliquota municipal quando disponivel
      const aliquotaIss = context?.aliquotaIssMunicipal ?? this.ALIQUOTA_ISS_PADRAO;
      results.push({
        tipo: TipoImposto.ISS,
        baseCalculo: valorTotal.toString(),
        aliquota: aliquotaIss.toString(),
        valor: valorTotal.times(aliquotaIss).toDecimalPlaces(2).toString(),
      });
    } else {
      // ICMS — usa aliquotas reais baseadas na UF
      const ufOrigem = context?.ufOrigem || 'SP';
      const ufDestino = context?.ufDestino || ufOrigem;

      const aliquota = ufOrigem === ufDestino
        ? new Decimal(ICMS_ALIQUOTA_INTERNA[ufOrigem] ?? 0.18)
        : new Decimal(getAliquotaInterestadual(ufOrigem, ufDestino));

      results.push({
        tipo: TipoImposto.ICMS,
        baseCalculo: valorTotal.toString(),
        aliquota: aliquota.toString(),
        valor: valorTotal.times(aliquota).toDecimalPlaces(2).toString(),
      });

      // ICMS-ST — quando NCM esta na tabela de substituicao tributaria
      if (ufOrigem !== ufDestino && ncm) {
        const ncm4 = ncm.substring(0, 4);
        const valorIpi = context?.valorIpi?.toNumber() ?? 0;
        const st = calcularIcmsSt({
          valorProduto: valorTotal.toNumber(),
          valorIpi,
          ufOrigem,
          ufDestino,
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

      // DIFAL — para operacoes interestaduais B2C (consumidor final)
      if (context?.isConsumidorFinal && ufOrigem !== ufDestino) {
        const difal = calcularDifal(ufOrigem, ufDestino, valorTotal.toNumber());
        if (difal.valorDifal > 0) {
          results.push({
            tipo: TipoImposto.ICMS,
            subtipo: 'DIFAL',
            baseCalculo: valorTotal.toString(),
            aliquota: (difal.aliquotaInterna - difal.aliquotaInterestadual).toString(),
            valor: difal.valorDifal.toString(),
          });
        }
      }
    }

    return results;
  }
}
