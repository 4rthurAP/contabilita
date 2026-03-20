import Decimal from 'decimal.js';
import { TipoImposto } from '@contabilita/shared';
import { TaxCalculationStrategy, TaxCalculationInput, TaxLineResult } from './tax-calculation.strategy';

/**
 * Calculo de impostos para Lucro Real.
 *
 * PIS: 1.65% nao-cumulativo (gera credito nas entradas)
 * COFINS: 7.6% nao-cumulativo (gera credito nas entradas)
 * ICMS: aliquota estadual (simplificado 18%)
 * ISS: aliquota municipal (simplificado 5%)
 * IRPJ/CSLL: calculados sobre lucro real (via LALUR)
 */
export class LucroRealStrategy implements TaxCalculationStrategy {
  private readonly ALIQUOTA_PIS = new Decimal('0.0165');
  private readonly ALIQUOTA_COFINS = new Decimal('0.076');
  private readonly ALIQUOTA_ICMS = new Decimal('0.18');
  private readonly ALIQUOTA_ISS = new Decimal('0.05');

  calculateItemTaxes(input: TaxCalculationInput): TaxLineResult[] {
    const results: TaxLineResult[] = [];
    const { valorTotal, isServico } = input;

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
      results.push({
        tipo: TipoImposto.ISS,
        baseCalculo: valorTotal.toString(),
        aliquota: this.ALIQUOTA_ISS.toString(),
        valor: valorTotal.times(this.ALIQUOTA_ISS).toDecimalPlaces(2).toString(),
      });
    } else {
      results.push({
        tipo: TipoImposto.ICMS,
        baseCalculo: valorTotal.toString(),
        aliquota: this.ALIQUOTA_ICMS.toString(),
        valor: valorTotal.times(this.ALIQUOTA_ICMS).toDecimalPlaces(2).toString(),
      });
    }

    return results;
  }
}
