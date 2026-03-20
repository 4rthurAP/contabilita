import { api } from '@/lib/api';

export const assetsService = {
  getAssets: (companyId: string) =>
    api.get(`/companies/${companyId}/assets`).then((r) => r.data),

  depreciateMonth: (companyId: string, year: number, month: number) =>
    api.post(`/companies/${companyId}/assets/depreciate/${year}/${month}`).then((r) => r.data),
};
