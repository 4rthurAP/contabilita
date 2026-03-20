import { api } from '@/lib/api';

export interface Registro {
  _id: string;
  tipo: string;
  status: string;
  dataProtocolo?: string;
  nire?: string;
  observacoes?: string;
  createdAt: string;
}

export interface AtividadeRegistro {
  _id: string;
  descricao: string;
  responsavel?: string;
  prazo?: string;
  concluida: boolean;
}

export const registroService = {
  getAll: (companyId: string, status?: string) =>
    api.get(`/companies/${companyId}/registros`, { params: { status } }).then((r) => r.data),

  getById: (companyId: string, id: string) =>
    api.get(`/companies/${companyId}/registros/${id}`).then((r) => r.data),

  create: (companyId: string, data: any) =>
    api.post(`/companies/${companyId}/registros`, data).then((r) => r.data),

  updateStatus: (companyId: string, id: string, status: string) =>
    api.patch(`/companies/${companyId}/registros/${id}/status`, { status }).then((r) => r.data),

  addAtividade: (companyId: string, registroId: string, data: any) =>
    api.post(`/companies/${companyId}/registros/${registroId}/atividades`, data).then((r) => r.data),

  toggleAtividade: (companyId: string, registroId: string, atividadeId: string) =>
    api.patch(`/companies/${companyId}/registros/${registroId}/atividades/${atividadeId}/toggle`).then((r) => r.data),
};
