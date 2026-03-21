/**
 * Nomes das filas BullMQ usadas no sistema.
 * Cada fila atende um dominio de processamento assincrono.
 */
export const QUEUE_NAMES = {
  /** Processamento de XMLs de NFe (importacao em lote) */
  XML_PROCESSING: 'xml-processing',
  /** OCR de documentos fiscais (recibos, notas) */
  OCR_PROCESSING: 'ocr-processing',
  /** Distribuicao DFe - busca automatica de NFes no SEFAZ */
  NFE_DISTRIBUTION: 'nfe-distribution',
  /** Geracao e envio de eventos eSocial */
  ESOCIAL_EVENTS: 'esocial-events',
  /** Busca automatica de certidoes (CND) */
  CERTIDAO_FETCH: 'certidao-fetch',
  /** Conciliacao bancaria automatica */
  BANK_RECONCILIATION: 'bank-reconciliation',
  /** Geracao assincrona de relatorios (PDF, SPED) */
  REPORT_GENERATION: 'report-generation',
  /** Envio de emails e notificacoes */
  NOTIFICATION_EMAIL: 'notification-email',
  /** Transmissao de arquivos SPED (EFD, ECD, Reinf) */
  SPED_TRANSMISSION: 'sped-transmission',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/** Configuracoes padrao por fila */
export const QUEUE_DEFAULT_OPTIONS = {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 5000 },
    removeOnComplete: { age: 24 * 3600, count: 1000 },
    removeOnFail: { age: 7 * 24 * 3600, count: 5000 },
  },
};
