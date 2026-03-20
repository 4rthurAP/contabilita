import { api } from '@/lib/api';

export const auditService = {
  getLogs: (params: { page?: number; limit?: number; resource?: string }) =>
    api.get('/audit', { params }).then((r) => r.data),
};
