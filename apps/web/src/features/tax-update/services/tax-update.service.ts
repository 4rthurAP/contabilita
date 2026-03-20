import { api } from '@/lib/api';

export const taxUpdateService = {
  getOverdue: (companyId: string) =>
    api.get(`/companies/${companyId}/tax-update/overdue`).then((r) => r.data),
};
