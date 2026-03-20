/** Tipo da conta no plano de contas */
export enum TipoConta {
  Ativo = 'ativo',
  Passivo = 'passivo',
  PatrimonioLiquido = 'patrimonio_liquido',
  Receita = 'receita',
  Despesa = 'despesa',
  CustoProducao = 'custo_producao',
}

/** Natureza do saldo da conta */
export enum NaturezaConta {
  Devedora = 'devedora',
  Credora = 'credora',
}

/** Tipo de lancamento contabil */
export enum TipoLancamento {
  Manual = 'manual',
  Automatico = 'automatico',
  Importado = 'importado',
  Estorno = 'estorno',
}

/** Status do periodo contabil */
export enum StatusPeriodo {
  Aberto = 'aberto',
  Fechado = 'fechado',
  Provisorio = 'provisorio',
}
