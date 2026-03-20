import Decimal from 'decimal.js';
import { TipoImposto } from '@contabilita/shared';
import { TaxCalculationStrategy, TaxCalculationInput, TaxLineResult } from './tax-calculation.strategy';

/**
 * Calculo de impostos para Lucro Presumido.
 *
 * PIS: 0.65% cumulativo
 * COFINS: 3% cumulativo
 * ICMS: aliquota estadual (simplificado 18%)
 * ISS: aliquota municipal (simplificado 5%)
 * IRPJ/CSLL: calculados trimestralmente na apuracao
 */
export class LucroPresumidoStrategy implements TaxCalculationStrategy {
  private readonly ALIQUOTA_PIS = new Decimal('0.0065');
  private readonly ALIQUOTA_COFINS = new Decimal('0.03');
  private readonly ALIQUOTA_ICMS = new Decimal('0.18');
  private readonly ALIQUOTA_ISS = new Decimal('0.05');

  calculateItemTaxes(input: TaxCalculationInput): TaxLineResult[] {
    const results: TaxLineResult[] = [];
    const { valorTotal, isServico } = input;

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
      // ISS para servicos
      results.push({
        tipo: TipoImposto.ISS,
        baseCalculo: valorTotal.toString(),
        aliquota: this.ALIQUOTA_ISS.toString(),
        valor: valorTotal.times(this.ALIQUOTA_ISS).toDecimalPlaces(2).toString(),
      });
    } else {
      // ICMS para mercadorias
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
