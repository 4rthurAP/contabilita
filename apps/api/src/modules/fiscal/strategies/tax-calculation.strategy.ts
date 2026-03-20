import Decimal from 'decimal.js';
import { TipoImposto } from '@contabilita/shared';

export interface TaxLineResult {
  tipo: TipoImposto;
  baseCalculo: string;
  aliquota: string;
  valor: string;
}

export interface TaxCalculationInput {
  valorTotal: Decimal;
  isServico: boolean;
  cfop: string;
  ncm: string;
}

/**
 * Interface para estrategias de calculo de impostos por regime tributario.
 */
export interface TaxCalculationStrategy {
  /**
   * Calcula impostos para um item de nota fiscal.
   */
  calculateItemTaxes(input: TaxCalculationInput): TaxLineResult[];
}
