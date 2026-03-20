/**
 * Tabela progressiva INSS 2024
 * Aliquotas aplicadas por faixa (calculo progressivo)
 */
export const TABELA_INSS_2024 = [
  { ate: 1412.0, aliquota: 0.075 },
  { ate: 2666.68, aliquota: 0.09 },
  { ate: 4000.03, aliquota: 0.12 },
  { ate: 7786.02, aliquota: 0.14 },
] as const;

/**
 * Tabela progressiva IRRF 2024
 * Base de calculo = salario bruto - INSS - dependentes (R$ 189,59/dep)
 */
export const TABELA_IRRF_2024 = [
  { ate: 2259.2, aliquota: 0, deducao: 0 },
  { ate: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { ate: 3751.05, aliquota: 0.15, deducao: 381.44 },
  { ate: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { ate: Infinity, aliquota: 0.275, deducao: 896.0 },
] as const;

/** Valor da deducao por dependente no IRRF */
export const DEDUCAO_DEPENDENTE_IRRF = 189.59;

/** Aliquota FGTS sobre remuneracao */
export const ALIQUOTA_FGTS = 0.08;

/**
 * Anexos do Simples Nacional - aliquotas iniciais por faixa de faturamento
 * Simplificado para referencia - a tabela completa tem 6 faixas por anexo
 */
export const SIMPLES_NACIONAL_ANEXOS = {
  anexoI: { descricao: 'Comercio', aliquotaInicial: 0.04 },
  anexoII: { descricao: 'Industria', aliquotaInicial: 0.045 },
  anexoIII: { descricao: 'Servicos (ISS)', aliquotaInicial: 0.06 },
  anexoIV: { descricao: 'Servicos (construcao, advocacia)', aliquotaInicial: 0.045 },
  anexoV: { descricao: 'Servicos (tecnologia, engenharia)', aliquotaInicial: 0.155 },
} as const;
