/** Regime tributario da empresa */
export enum RegimeTributario {
  SimplesNacional = 'simples_nacional',
  LucroPresumido = 'lucro_presumido',
  LucroReal = 'lucro_real',
  Imune = 'imune',
  Isenta = 'isenta',
}

/** Tipo de nota fiscal */
export enum TipoNotaFiscal {
  Entrada = 'entrada',
  Saida = 'saida',
}

/** Status da nota fiscal */
export enum StatusNotaFiscal {
  Rascunho = 'rascunho',
  Escriturada = 'escriturada',
  Cancelada = 'cancelada',
}

/** Tipo do imposto */
export enum TipoImposto {
  ICMS = 'icms',
  IPI = 'ipi',
  PIS = 'pis',
  COFINS = 'cofins',
  ISS = 'iss',
  IRPJ = 'irpj',
  CSLL = 'csll',
  IRRF = 'irrf',
  INSS = 'inss',
  FGTS = 'fgts',
}

/** Status da guia de pagamento */
export enum StatusGuia {
  Pendente = 'pendente',
  Paga = 'paga',
  Vencida = 'vencida',
  Parcelada = 'parcelada',
}
