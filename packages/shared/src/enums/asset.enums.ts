/** Status do bem patrimonial */
export enum StatusBem {
  Ativo = 'ativo',
  Baixado = 'baixado',
  Transferido = 'transferido',
}

/** Metodo de depreciacao */
export enum MetodoDepreciacao {
  Linear = 'linear',
  SaldoDecrescente = 'saldo_decrescente',
}

/** Tipo de movimentacao do bem */
export enum TipoMovimentacaoBem {
  Aquisicao = 'aquisicao',
  Depreciacao = 'depreciacao',
  Reavaliacao = 'reavaliacao',
  Baixa = 'baixa',
  Transferencia = 'transferencia',
}
