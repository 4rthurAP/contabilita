import { api } from '@/lib/api';

export interface LalurEntry {
  _id: string;
  tipo: string;
  descricao: string;
  valor: any;
  year: number;
  quarter: number;
}

export interface LalurBalance {
  _id: string;
  tipo: string;
  descricao: string;
  saldoInicial: any;
  saldoFinal: any;
  year: number;
}

export interface LucroRealResult {
  lucroContabil: string;
  totalAdicoes: string;
  totalExclusoes: string;
  compensacaoPrejuizos: string;
  lucroReal: string;
  entries: number;
}

export const lalurService = {
  getEntries: (companyId: string, year: number, quarter?: number) =>
    api
      .get(`/companies/${companyId}/lalur/entries/${year}`, { params: { quarter } })
      .then((r) => r.data),

  createEntry: (companyId: string, data: any) =>
    api.post(`/companies/${companyId}/lalur/entries`, data).then((r) => r.data),

  getBalances: (companyId: string, year: number) =>
    api.get(`/companies/${companyId}/lalur/balances/${year}`).then((r) => r.data),

  createBalance: (companyId: string, data: any) =>
    api.post(`/companies/${companyId}/lalur/balances`, data).then((r) => r.data),

  calculate: (companyId: string, year: number, quarter: number, lucroContabil: string) =>
    api
      .get(`/companies/${companyId}/lalur/calculate/${year}/${quarter}`, {
        params: { lucroContabil },
      })
      .then((r) => r.data),
};
