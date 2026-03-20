import { api } from '@/lib/api';

export interface Contrato {
  _id: string;
  descricao: string;
  empresaId: string;
  empresaNome?: string;
  valorMensal: any;
  status: string;
  periodicidade: string;
  dataInicio: string;
  dataFim?: string;
  formaPagamento?: string;
  observacoes?: string;
}

export interface Cobranca {
  _id: string;
  contratoId: string;
  competencia: string;
  valor: any;
  dataVencimento: string;
  dataPagamento?: string;
  status: string;
  formaPagamento?: string;
  empresaNome?: string;
}

export interface FluxoCaixaItem {
  mes: string;
  orcado: number;
  realizado: number;
}

export const honorariosService = {
  // Contratos
  getContratos: (companyId: string, status?: string) =>
    api.get(`/companies/${companyId}/honorarios/contratos`, { params: { status } }).then((r) => r.data),

  createContrato: (companyId: string, data: any) =>
    api.post(`/companies/${companyId}/honorarios/contratos`, data).then((r) => r.data),

  updateContrato: (companyId: string, id: string, data: any) =>
    api.put(`/companies/${companyId}/honorarios/contratos/${id}`, data).then((r) => r.data),

  // Cobrancas
  getCobrancas: (companyId: string, params?: Record<string, any>) =>
    api.get(`/companies/${companyId}/honorarios/cobrancas`, { params }).then((r) => r.data),

  markCobrancaPaid: (companyId: string, id: string, dataPagamento: string) =>
    api.patch(`/companies/${companyId}/honorarios/cobrancas/${id}/pay`, { dataPagamento }).then((r) => r.data),

  generateBilling: (companyId: string, year: number, month: number) =>
    api.post(`/companies/${companyId}/honorarios/cobrancas/generate/${year}/${month}`).then((r) => r.data),

  // Fluxo de Caixa
  getCashFlow: (companyId: string, year: number) =>
    api.get(`/companies/${companyId}/honorarios/fluxo-caixa/${year}`).then((r) => r.data),
};
