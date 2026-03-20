import { useQuery } from '@tanstack/react-query';
import { auditService } from '../services/audit.service';

export function useAuditLogs(page: number, resource?: string) {
  return useQuery({
    queryKey: ['audit', page, resource],
    queryFn: () =>
      auditService.getLogs({ page, limit: 30, ...(resource && { resource }) }),
  });
}
