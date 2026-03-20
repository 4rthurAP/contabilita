import { api } from '@/lib/api';

export const reportsService = {
  getBalancoPatrimonial: (companyId: string, endDate: string) =>
    api
      .get(`/companies/${companyId}/reports/balanco-patrimonial`, { params: { endDate } })
      .then((r) => r.data),

  getDre: (companyId: string, startDate: string, endDate: string) =>
    api
      .get(`/companies/${companyId}/reports/dre`, { params: { startDate, endDate } })
      .then((r) => r.data),
};
