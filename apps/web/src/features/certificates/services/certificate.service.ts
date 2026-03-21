import { api } from '@/lib/api';

export interface CertificateInfo {
  _id: string;
  companyId: string;
  tipo: 'A1' | 'A3';
  nome: string;
  titular: string;
  documento: string;
  serialNumber: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  status: 'valido' | 'expirando' | 'expirado' | 'revogado';
  fingerprint: string;
  createdAt: string;
}

export const certificateService = {
  getAll: (companyId?: string) =>
    api
      .get<{ data: CertificateInfo[] }>('/certificates', {
        params: companyId ? { companyId } : undefined,
      })
      .then((r) => r.data.data ?? r.data),

  getById: (id: string) =>
    api.get<{ data: CertificateInfo }>(`/certificates/${id}`).then((r) => r.data.data ?? r.data),

  upload: (file: File, companyId: string, password: string, tipo = 'A1', nome?: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('companyId', companyId);
    form.append('password', password);
    form.append('tipo', tipo);
    if (nome) form.append('nome', nome);

    return api
      .post<{ data: CertificateInfo }>('/certificates/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data ?? r.data);
  },

  remove: (id: string) => api.delete(`/certificates/${id}`).then((r) => r.data),
};
