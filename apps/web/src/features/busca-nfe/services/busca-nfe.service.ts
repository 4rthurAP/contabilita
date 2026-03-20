import { api } from '@/lib/api';

export interface BuscaNfeLog {
  _id: string;
  dataConsulta: string;
  quantidadeEncontrada: number;
  quantidadeImportada: number;
  erros: string[];
  ultimoNSU?: string;
}

export const buscaNfeService = {
  fetch: (companyId: string) =>
    api.post(`/companies/${companyId}/busca-nfe/fetch`).then((r) => r.data),

  getHistory: (companyId: string) =>
    api.get(`/companies/${companyId}/busca-nfe/history`).then((r) => r.data),
};
