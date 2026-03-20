/** Status da folha de pagamento */
export enum StatusFolha {
  Rascunho = 'rascunho',
  Calculada = 'calculada',
  Aprovada = 'aprovada',
  Fechada = 'fechada',
}

/** Tipo de execucao da folha */
export enum TipoFolha {
  Mensal = 'mensal',
  Ferias = 'ferias',
  DecimoTerceiroPrimeiraParcela = '13_primeira_parcela',
  DecimoTerceiroSegundaParcela = '13_segunda_parcela',
  Rescisao = 'rescisao',
  Complementar = 'complementar',
}

/** Tipo da rubrica no holerite */
export enum TipoRubrica {
  Provento = 'provento',
  Desconto = 'desconto',
  Informativa = 'informativa',
}

/** Status do funcionario */
export enum StatusFuncionario {
  Ativo = 'ativo',
  Afastado = 'afastado',
  Ferias = 'ferias',
  Demitido = 'demitido',
}
