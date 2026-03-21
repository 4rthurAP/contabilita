/**
 * Aliquotas interestaduais de ICMS (Resolucao do Senado 22/89 e 13/2012).
 * Chave: UF origem. Valor: { destino -> aliquota }.
 * Para operacoes internas, usar a aliquota interna do estado.
 */

/** Aliquotas internas de ICMS por UF */
export const ICMS_ALIQUOTA_INTERNA: Record<string, number> = {
  AC: 0.19, AL: 0.19, AM: 0.20, AP: 0.18, BA: 0.205,
  CE: 0.20, DF: 0.20, ES: 0.17, GO: 0.19, MA: 0.22,
  MG: 0.18, MS: 0.17, MT: 0.17, PA: 0.19, PB: 0.20,
  PE: 0.205, PI: 0.21, PR: 0.195, RJ: 0.22, RN: 0.20,
  RO: 0.195, RR: 0.20, RS: 0.17, SC: 0.17, SE: 0.19,
  SP: 0.18, TO: 0.20,
};

/**
 * Aliquota interestadual ICMS.
 * Sul/Sudeste (exceto ES) para Norte/Nordeste/CO/ES = 7%
 * Demais combinacoes = 12%
 * Importados = 4% (Resolucao 13/2012)
 */
const UF_SUL_SUDESTE = ['MG', 'PR', 'RJ', 'RS', 'SC', 'SP'];
const UF_NORTE_NE_CO_ES = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'RN', 'RO', 'RR', 'SE', 'TO',
];

export function getAliquotaInterestadual(ufOrigem: string, ufDestino: string): number {
  if (ufOrigem === ufDestino) {
    return ICMS_ALIQUOTA_INTERNA[ufOrigem] ?? 0.18;
  }
  if (UF_SUL_SUDESTE.includes(ufOrigem) && UF_NORTE_NE_CO_ES.includes(ufDestino)) {
    return 0.07;
  }
  return 0.12;
}

/**
 * Calcula DIFAL (Diferencial de Aliquota) para operacoes interestaduais B2C.
 * EC 87/2015: diferenca entre aliquota interna do destino e interestadual.
 */
export function calcularDifal(
  ufOrigem: string,
  ufDestino: string,
  valorBase: number,
): { valorDifal: number; aliquotaInterna: number; aliquotaInterestadual: number } {
  if (ufOrigem === ufDestino) {
    return { valorDifal: 0, aliquotaInterna: 0, aliquotaInterestadual: 0 };
  }

  const aliquotaInterna = ICMS_ALIQUOTA_INTERNA[ufDestino] ?? 0.18;
  const aliquotaInterestadual = getAliquotaInterestadual(ufOrigem, ufDestino);
  const diferencial = aliquotaInterna - aliquotaInterestadual;

  // Base de calculo com ICMS "por dentro"
  const baseCalculo = valorBase / (1 - aliquotaInterna);
  const valorDifal = Math.max(0, baseCalculo * diferencial);

  return {
    valorDifal: Math.round(valorDifal * 100) / 100,
    aliquotaInterna,
    aliquotaInterestadual,
  };
}

/**
 * MVA (Margem de Valor Agregado) para ICMS-ST por NCM (simplificado).
 * Em producao, esta tabela viria de uma API ou banco de dados atualizado
 * pela SEFAZ de cada estado.
 */
export const ICMS_ST_MVA_PADRAO: Record<string, number> = {
  // Bebidas (NCM 22)
  '2201': 1.40,
  '2202': 1.40,
  '2203': 1.40,
  // Cigarros
  '2402': 1.774,
  // Combustiveis
  '2710': 1.7763,
  // Farinha/Cereais
  '1101': 0.60,
  // Automoveis
  '8703': 0.30,
  // Autopecas
  '8708': 0.597,
  // Tintas
  '3208': 0.35,
  '3209': 0.35,
  // Material de construcao
  '6802': 0.37,
  '6907': 0.37,
  // Material eletrico
  '8544': 0.42,
};

/**
 * Calcula ICMS-ST (Substituicao Tributaria).
 * Base ST = (valor produto + IPI) * (1 + MVA)
 * ICMS-ST = Base ST * aliquota interna destino - ICMS proprio
 */
export function calcularIcmsSt(params: {
  valorProduto: number;
  valorIpi: number;
  ufOrigem: string;
  ufDestino: string;
  ncm4: string;
}): { baseCalculoSt: number; valorIcmsSt: number; mvaAplicada: number } {
  const { valorProduto, valorIpi, ufOrigem, ufDestino, ncm4 } = params;

  const mva = ICMS_ST_MVA_PADRAO[ncm4] ?? 0;
  if (mva === 0) {
    return { baseCalculoSt: 0, valorIcmsSt: 0, mvaAplicada: 0 };
  }

  const aliquotaInterna = ICMS_ALIQUOTA_INTERNA[ufDestino] ?? 0.18;
  const aliquotaInterestadual = getAliquotaInterestadual(ufOrigem, ufDestino);

  const baseCalculoSt = (valorProduto + valorIpi) * (1 + mva);
  const icmsStBruto = baseCalculoSt * aliquotaInterna;
  const icmsProprio = valorProduto * aliquotaInterestadual;
  const valorIcmsSt = Math.max(0, icmsStBruto - icmsProprio);

  return {
    baseCalculoSt: Math.round(baseCalculoSt * 100) / 100,
    valorIcmsSt: Math.round(valorIcmsSt * 100) / 100,
    mvaAplicada: mva,
  };
}
