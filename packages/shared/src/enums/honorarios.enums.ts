export enum StatusContrato {
  Ativo = 'ativo',
  Suspenso = 'suspenso',
  Cancelado = 'cancelado',
}

export enum StatusCobranca {
  Pendente = 'pendente',
  Paga = 'paga',
  Vencida = 'vencida',
  Cancelada = 'cancelada',
}

export enum FormaPagamento {
  Boleto = 'boleto',
  PIX = 'pix',
  Transferencia = 'transferencia',
}

export enum PeriodicidadeContrato {
  Mensal = 'mensal',
  Trimestral = 'trimestral',
  Anual = 'anual',
}
