import { api } from '@/lib/api';

export const dashboardService = {
  getHealth: () => api.get('/health').then((r) => r.data),
};
