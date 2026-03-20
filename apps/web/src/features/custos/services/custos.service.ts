import { api } from '@/lib/api';

export interface TimeEntry {
  _id: string;
  empresaId: string;
  empresaNome?: string;
  data: string;
  duracao: number; // minutos
  categoria: string;
  descricao?: string;
  userId?: string;
  userName?: string;
}

export interface FixedCost {
  _id: string;
  descricao: string;
  valor: any;
  tipo: string;
  recorrencia: string;
}

export interface CustosAnalysisItem {
  empresaId: string;
  empresaNome: string;
  horasTrabalhadas: number;
  custoHora: number;
  custoTotal: number;
  receita: number;
  margem: number;
}

export const custosService = {
  // Time Entries
  getTimeEntries: (companyId: string, params?: Record<string, any>) =>
    api.get(`/companies/${companyId}/custos/time-entries`, { params }).then((r) => r.data),

  createTimeEntry: (companyId: string, data: any) =>
    api.post(`/companies/${companyId}/custos/time-entries`, data).then((r) => r.data),

  deleteTimeEntry: (companyId: string, id: string) =>
    api.delete(`/companies/${companyId}/custos/time-entries/${id}`).then((r) => r.data),

  // Fixed Costs
  getFixedCosts: () =>
    api.get('/custos/fixed-costs').then((r) => r.data),

  createFixedCost: (data: any) =>
    api.post('/custos/fixed-costs', data).then((r) => r.data),

  deleteFixedCost: (id: string) =>
    api.delete(`/custos/fixed-costs/${id}`).then((r) => r.data),

  // Analysis
  getAnalysis: (year: number, month: number) =>
    api.get(`/custos/analysis/${year}/${month}`).then((r) => r.data),
};
