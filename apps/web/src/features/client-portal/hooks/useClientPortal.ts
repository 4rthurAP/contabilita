import { useQuery } from '@tanstack/react-query';
import { clientPortalService } from '../services/client-portal.service';

export function usePortalSummary(companyId: string) {
  return useQuery({
    queryKey: ['portal-summary', companyId],
    queryFn: () => clientPortalService.getSummary(companyId),
    enabled: !!companyId,
  });
}

export function usePortalPayments(companyId: string, status?: string) {
  return useQuery({
    queryKey: ['portal-payments', companyId, status],
    queryFn: () => clientPortalService.getPayments(companyId, status),
    enabled: !!companyId,
  });
}

export function usePortalObligations(companyId: string) {
  return useQuery({
    queryKey: ['portal-obligations', companyId],
    queryFn: () => clientPortalService.getObligations(companyId),
    enabled: !!companyId,
  });
}
