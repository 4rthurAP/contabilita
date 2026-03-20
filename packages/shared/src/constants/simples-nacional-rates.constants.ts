/**
 * Anexos do Simples Nacional - Tabela completa com 6 faixas
 * Lei Complementar 123/2006 (atualizada pela LC 155/2016)
 */
export interface SimplesNacionalFaixa {
  ate: number;
  aliquota: number;
  deducao: number;
}

export const SIMPLES_NACIONAL_ANEXO_I: SimplesNacionalFaixa[] = [
  { ate: 180000, aliquota: 0.04, deducao: 0 },
  { ate: 360000, aliquota: 0.073, deducao: 5940 },
  { ate: 720000, aliquota: 0.095, deducao: 13860 },
  { ate: 1800000, aliquota: 0.107, deducao: 22500 },
  { ate: 3600000, aliquota: 0.143, deducao: 87300 },
  { ate: 4800000, aliquota: 0.19, deducao: 378000 },
];

export const SIMPLES_NACIONAL_ANEXO_II: SimplesNacionalFaixa[] = [
  { ate: 180000, aliquota: 0.045, deducao: 0 },
  { ate: 360000, aliquota: 0.078, deducao: 5940 },
  { ate: 720000, aliquota: 0.10, deducao: 13860 },
  { ate: 1800000, aliquota: 0.112, deducao: 22500 },
  { ate: 3600000, aliquota: 0.147, deducao: 85500 },
  { ate: 4800000, aliquota: 0.30, deducao: 720000 },
];

export const SIMPLES_NACIONAL_ANEXO_III: SimplesNacionalFaixa[] = [
  { ate: 180000, aliquota: 0.06, deducao: 0 },
  { ate: 360000, aliquota: 0.112, deducao: 9360 },
  { ate: 720000, aliquota: 0.135, deducao: 17640 },
  { ate: 1800000, aliquota: 0.16, deducao: 35640 },
  { ate: 3600000, aliquota: 0.21, deducao: 125640 },
  { ate: 4800000, aliquota: 0.33, deducao: 648000 },
];

export const SIMPLES_NACIONAL_ANEXO_IV: SimplesNacionalFaixa[] = [
  { ate: 180000, aliquota: 0.045, deducao: 0 },
  { ate: 360000, aliquota: 0.09, deducao: 8100 },
  { ate: 720000, aliquota: 0.102, deducao: 12420 },
  { ate: 1800000, aliquota: 0.14, deducao: 39780 },
  { ate: 3600000, aliquota: 0.22, deducao: 183780 },
  { ate: 4800000, aliquota: 0.33, deducao: 828000 },
];

export const SIMPLES_NACIONAL_ANEXO_V: SimplesNacionalFaixa[] = [
  { ate: 180000, aliquota: 0.155, deducao: 0 },
  { ate: 360000, aliquota: 0.18, deducao: 4500 },
  { ate: 720000, aliquota: 0.195, deducao: 9900 },
  { ate: 1800000, aliquota: 0.205, deducao: 17100 },
  { ate: 3600000, aliquota: 0.23, deducao: 62100 },
  { ate: 4800000, aliquota: 0.305, deducao: 540000 },
];

/** Map de CNAE para Anexo (simplificado - CNAEs mais comuns) */
export const CNAE_ANEXO_MAP: Record<string, string> = {
  '4711302': 'I',
  '4712100': 'I',
  '4721102': 'I',
  '4751201': 'I',
  '4753900': 'I',
  '1091101': 'II',
  '1099699': 'II',
  '1412601': 'II',
  '6201501': 'III',
  '6202300': 'III',
  '6311900': 'III',
  '6399200': 'III',
  '7112000': 'III',
  '6920601': 'IV',
  '6920602': 'IV',
  '6911701': 'IV',
  '7111100': 'V',
  '7120100': 'V',
  '6204000': 'V',
};

export function getAnexoTable(anexo: string): SimplesNacionalFaixa[] {
  switch (anexo) {
    case 'I': return SIMPLES_NACIONAL_ANEXO_I;
    case 'II': return SIMPLES_NACIONAL_ANEXO_II;
    case 'III': return SIMPLES_NACIONAL_ANEXO_III;
    case 'IV': return SIMPLES_NACIONAL_ANEXO_IV;
    case 'V': return SIMPLES_NACIONAL_ANEXO_V;
    default: return SIMPLES_NACIONAL_ANEXO_I;
  }
}

export function calcularAliquotaEfetiva(receita12m: number, faixas: SimplesNacionalFaixa[]): number {
  const faixa = faixas.find((f) => receita12m <= f.ate) || faixas[faixas.length - 1];
  if (receita12m <= 0) return 0;
  return (receita12m * faixa.aliquota - faixa.deducao) / receita12m;
}
