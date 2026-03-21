import Decimal from 'decimal.js';
import { TipoImposto } from '@contabilita/shared';

export interface TaxLineResult {
  tipo: TipoImposto;
  baseCalculo: string;
  aliquota: string;
  valor: string;
  /** Subtipo para diferenciar ICMS-ST, DIFAL, etc. */
  subtipo?: string;
}

export interface TaxCalculationInput {
  valorTotal: Decimal;
  isServico: boolean;
  cfop: string;
  ncm: string;
}

/**
 * Contexto estendido para calculos que dependem de UF, operacoes interestaduais,
 * e regime cumulativo/nao-cumulativo.
 */
export interface TaxCalculationContext {
  /** UF do emitente */
  ufOrigem?: string;
  /** UF do destinatario */
  ufDestino?: string;
  /** Operacao interestadual B2C (consumidor final) — habilita DIFAL */
  isConsumidorFinal?: boolean;
  /** Valor do IPI do item (para base ICMS-ST) */
  valorIpi?: Decimal;
  /** Receita Bruta dos ultimos 12 meses (para Simples Nacional) */
  rbt12?: Decimal;
  /** Anexo do Simples Nacional (I a V) */
  anexoSimples?: string;
  /** Codigo do municipio (para ISS) */
  codigoMunicipio?: string;
  /** Aliquota ISS do municipio (quando informada) */
  aliquotaIssMunicipal?: Decimal;
}

/**
 * Interface para estrategias de calculo de impostos por regime tributario.
 */
export interface TaxCalculationStrategy {
  /**
   * Calcula impostos para um item de nota fiscal.
   */
  calculateItemTaxes(input: TaxCalculationInput, context?: TaxCalculationContext): TaxLineResult[];
}
