import { api } from '@/lib/api';

export interface DashboardSummary {
  companiesCount: number;
  entriesThisMonth: number;
  employeesCount: number;
  pendingReconciliation: number;
  pendingPaymentsTotal: string;
  upcomingObligations: number;
  overduePayments: number;
}

export interface ActivityItem {
  _id: string;
  action: string;
  resource: string;
  description: string;
  userName: string;
  createdAt: string;
}

export interface DreTrendItem {
  month: string;
  receita: string;
  despesa: string;
  resultado: string;
}

export interface TaxBurdenItem {
  tipo: string;
  totalRecolher: string;
  totalApurado: string;
}

export const dashboardService = {
  getHealth: () => api.get('/health').then((r) => r.data),

  getSummary: (companyId?: string) =>
    api
      .get<DashboardSummary>('/dashboard/summary', { params: companyId ? { companyId } : {} })
      .then((r) => r.data),

  getActivity: (companyId?: string, limit = 10) =>
    api
      .get<ActivityItem[]>('/dashboard/activity', { params: { companyId, limit } })
      .then((r) => r.data),

  getDreTrend: (companyId: string, months = 12) =>
    api
      .get<DreTrendItem[]>('/dashboard/charts/dre-trend', { params: { companyId, months } })
      .then((r) => r.data),

  getTaxBurden: (companyId: string, year?: number) =>
    api
      .get<TaxBurdenItem[]>('/dashboard/charts/tax-burden', { params: { companyId, year } })
      .then((r) => r.data),
};
