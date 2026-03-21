import Decimal from 'decimal.js';
import { TipoImposto, getAliquotaInterestadual, ICMS_ALIQUOTA_INTERNA, calcularIcmsSt, calcularDifal } from '@contabilita/shared';
import { TaxCalculationStrategy, TaxCalculationInput, TaxCalculationContext, TaxLineResult } from './tax-calculation.strategy';

/**
 * Calculo de impostos para Lucro Real.
 *
 * PIS: 1.65% nao-cumulativo (gera credito nas entradas)
 * COFINS: 7.6% nao-cumulativo (gera credito nas entradas)
 * ICMS: aliquota estadual por UF
 * ISS: aliquota municipal
 * ICMS-ST/DIFAL: operacoes interestaduais
 * IRPJ/CSLL: calculados sobre lucro real (via LALUR)
 */
export class LucroRealStrategy implements TaxCalculationStrategy {
  private readonly ALIQUOTA_PIS = new Decimal('0.0165');
  private readonly ALIQUOTA_COFINS = new Decimal('0.076');
  private readonly ALIQUOTA_ISS_PADRAO = new Decimal('0.05');

  calculateItemTaxes(input: TaxCalculationInput, context?: TaxCalculationContext): TaxLineResult[] {
    const results: TaxLineResult[] = [];
    const { valorTotal, isServico, ncm } = input;

    // PIS nao-cumulativo
    results.push({
      tipo: TipoImposto.PIS,
      baseCalculo: valorTotal.toString(),
      aliquota: this.ALIQUOTA_PIS.toString(),
      valor: valorTotal.times(this.ALIQUOTA_PIS).toDecimalPlaces(2).toString(),
    });

    // COFINS nao-cumulativo
    results.push({
      tipo: TipoImposto.COFINS,
      baseCalculo: valorTotal.toString(),
      aliquota: this.ALIQUOTA_COFINS.toString(),
      valor: valorTotal.times(this.ALIQUOTA_COFINS).toDecimalPlaces(2).toString(),
    });

    if (isServico) {
      const aliquotaIss = context?.aliquotaIssMunicipal ?? this.ALIQUOTA_ISS_PADRAO;
      results.push({
        tipo: TipoImposto.ISS,
        baseCalculo: valorTotal.toString(),
        aliquota: aliquotaIss.toString(),
        valor: valorTotal.times(aliquotaIss).toDecimalPlaces(2).toString(),
      });
    } else {
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

      // ICMS-ST
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

      // DIFAL
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
