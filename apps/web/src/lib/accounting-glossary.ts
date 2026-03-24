/**
 * Glossario de termos contabeis brasileiros.
 * Usado pelo HelpTooltip para explicar conceitos complexos ao usuario.
 */
export const GLOSSARY = {
  planoDeContas:
    'Estrutura hierarquica das contas contabeis da empresa, organizada por grupos (Ativo, Passivo, Receita, Despesa).',
  partidaDobrada:
    'Todo lancamento contabil tem pelo menos um debito e um credito de mesmo valor — os dois lados devem estar equilibrados.',
  balancete:
    'Relatorio que lista todas as contas com seus saldos, verificando se debitos e creditos estao equilibrados.',
  dre: 'Demonstracao do Resultado do Exercicio — resume receitas e despesas para apurar lucro ou prejuizo do periodo.',
  balancoPatrimonial:
    'Relatorio que mostra a posicao financeira da empresa em um momento: Ativo = Passivo + Patrimonio Liquido.',
  razaoContabil:
    'Livro que registra todas as movimentacoes de cada conta contabil, em ordem cronologica.',
  lalur:
    'Livro de Apuracao do Lucro Real — registra os ajustes fiscais (adicoes e exclusoes) sobre o lucro contabil.',
  sped: 'Sistema Publico de Escrituracao Digital — obrigacoes eletronicas (ECD, EFD, etc.) entregues ao governo federal.',
  ecd: 'Escrituracao Contabil Digital — versao digital dos livros Diario e Razao, entregue via SPED.',
  efd: 'Escrituracao Fiscal Digital — registros de documentos fiscais e apuracoes de ICMS/IPI.',
  dctfWeb:
    'Declaracao de Debitos e Creditos Tributarios Federais — informa tributos previdenciarios e de terceiros.',
  regimeTributario:
    'Enquadramento fiscal da empresa: Simples Nacional (ate R$4,8M), Lucro Presumido ou Lucro Real.',
  simplesNacional:
    'Regime simplificado para micro e pequenas empresas com faturamento ate R$4,8M/ano. Unifica varios tributos em guia unica (DAS).',
  lucroPresumido:
    'Regime onde a base de calculo do IR e CSLL e estimada por percentuais fixos sobre a receita bruta.',
  lucroReal:
    'Regime onde IR e CSLL incidem sobre o lucro efetivo, ajustado pelas adicoes e exclusoes do LALUR.',
  conciliacao:
    'Processo de confrontar os registros contabeis com os extratos bancarios para identificar divergencias.',
  apuracaoFiscal:
    'Calculo dos impostos devidos no periodo, com base nas notas fiscais de entrada e saida.',
  depreciacao:
    'Reducao do valor contabil de bens do ativo imobilizado ao longo de sua vida util estimada.',
  cargaTributaria:
    'Total de impostos pagos em relacao ao faturamento — indica o peso fiscal sobre a operacao.',
  notaFiscal:
    'Documento que registra uma operacao de venda ou prestacao de servico, exigido pelo fisco.',
  guiaDePagamento:
    'Documento para recolhimento de tributos (DARF, DAS, GPS, etc.) junto aos orgaos competentes.',
  obrigacoesAcessorias:
    'Declaracoes e escrituracoes que a empresa deve entregar ao governo, alem do pagamento dos impostos.',
  competencia:
    'Mes/ano a que se refere o fato gerador do tributo ou lancamento contabil.',
  tipoLancamento:
    'Classificacao do lancamento: Manual (digitado), Automatico (gerado pelo sistema), Importado (via arquivo) ou Estorno (reversao).',
  codigoIbge:
    'Codigo numerico do IBGE que identifica o municipio — usado em obrigacoes fiscais e cadastros.',
} as const;
