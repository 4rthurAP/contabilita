import { api } from '@/lib/api';

export interface RegimeComparison {
  regime: string;
  impostoTotal: number;
  aliquotaEfetiva: number;
  detalhes: { imposto: string; valor: number }[];
}

export interface SimplesRatesResult {
  anexo: string;
  faixa: number;
  aliquotaNominal: number;
  aliquotaEfetiva: number;
  deducao: number;
  rbt12: number;
}

export interface PisCofinsResult {
  ncm: string;
  descricao?: string;
  pisAliquota: number;
  cofinsAliquota: number;
  cst: string;
  natureza?: string;
}

export const cctService = {
  compareRegimes: (data: { receitaAnual: number; despesasAnuais: number }) =>
    api.post('/cct/compare-regimes', data).then((r) => r.data),

  getSimplesRates: (data: { cnae: string; receita12m: number }) =>
    api.post('/cct/simples-rates', data).then((r) => r.data),

  getPisCofins: (data: { ncm: string }) =>
    api.post('/cct/pis-cofins', data).then((r) => r.data),
};
