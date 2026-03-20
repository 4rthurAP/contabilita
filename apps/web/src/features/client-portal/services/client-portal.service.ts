import { api } from '@/lib/api';

export interface PortalSummary {
  pendingPayments: number;
  overduePayments: number;
  pendingObligations: number;
  recentPayrolls: any[];
}

export const clientPortalService = {
  getSummary: (companyId: string) =>
    api.get(`/companies/${companyId}/portal/summary`).then((r) => r.data),

  getPayments: (companyId: string, status?: string) =>
    api
      .get(`/companies/${companyId}/portal/payments`, { params: { status } })
      .then((r) => r.data),

  getObligations: (companyId: string) =>
    api.get(`/companies/${companyId}/portal/obligations`).then((r) => r.data),
};
