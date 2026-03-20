import { api } from '@/lib/api';

export interface Protocolo {
  _id: string;
  numero: string;
  tipo: string;
  status: string;
  data: string;
  descricao?: string;
  remetente?: string;
  destinatario?: string;
  empresaId: string;
  empresaNome?: string;
  observacoes?: string;
}

export const protocoloService = {
  getProtocolos: (companyId: string, params?: Record<string, any>) =>
    api.get(`/companies/${companyId}/protocolos`, { params }).then((r) => r.data),

  createProtocolo: (companyId: string, data: any) =>
    api.post(`/companies/${companyId}/protocolos`, data).then((r) => r.data),

  updateProtocolo: (companyId: string, id: string, data: any) =>
    api.put(`/companies/${companyId}/protocolos/${id}`, data).then((r) => r.data),

  updateStatus: (companyId: string, id: string, status: string) =>
    api.patch(`/companies/${companyId}/protocolos/${id}/status`, { status }).then((r) => r.data),
};
