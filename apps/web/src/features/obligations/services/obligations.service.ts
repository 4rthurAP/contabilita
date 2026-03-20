import { api } from '@/lib/api';

export const obligationsService = {
  getObligations: (companyId: string, year: number) =>
    api.get(`/companies/${companyId}/obligations`, { params: { year } }).then((r) => r.data),

  generateMonthly: (companyId: string, year: number, month: number) =>
    api.post(`/companies/${companyId}/obligations/generate-monthly/${year}/${month}`).then((r) => r.data),

  generateAnnual: (companyId: string, year: number) =>
    api.post(`/companies/${companyId}/obligations/generate-annual/${year}`).then((r) => r.data),

  generateSpedEcd: (companyId: string, year: number) =>
    api.post(`/companies/${companyId}/obligations/sped-ecd/${year}`).then((r) => r.data),

  generateSpedEfd: (companyId: string, year: number, month: number) =>
    api.post(`/companies/${companyId}/obligations/sped-efd/${year}/${month}`).then((r) => r.data),
};
