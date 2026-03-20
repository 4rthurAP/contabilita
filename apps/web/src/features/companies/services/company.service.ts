import { api } from '@/lib/api';
import type { RegimeTributario } from '@contabilita/shared';

export interface Company {
  _id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  regimeTributario: RegimeTributario;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  isActive: boolean;
  endereco?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    codigoIbge?: string;
  };
}

export interface CompanyListResponse {
  data: Company[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCompanyRequest {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  regimeTributario: RegimeTributario;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  codigoNaturezaJuridica?: string;
  endereco?: Company['endereco'];
}

export const companyService = {
  list: (page = 1, limit = 20, search?: string) =>
    api
      .get<CompanyListResponse>('/companies', { params: { page, limit, search } })
      .then((r) => r.data),

  getById: (id: string) => api.get<Company>(`/companies/${id}`).then((r) => r.data),

  create: (data: CreateCompanyRequest) =>
    api.post<Company>('/companies', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateCompanyRequest>) =>
    api.put<Company>(`/companies/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/companies/${id}`),
};
