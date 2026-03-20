import { useQuery } from '@tanstack/react-query';
import { taxUpdateService } from '../services/tax-update.service';

export function useOverdueTaxes(companyId: string) {
  return useQuery({
    queryKey: ['tax-update', companyId],
    queryFn: () => taxUpdateService.getOverdue(companyId),
    enabled: !!companyId,
  });
}
