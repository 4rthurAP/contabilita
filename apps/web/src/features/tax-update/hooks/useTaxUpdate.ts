import { useQuery } from '@tanstack/react-query';
import { taxUpdateService } from '../services/tax-update.service';
import { queryDefaults } from '@/lib/query-defaults';

export function useOverdueTaxes(companyId: string) {
  return useQuery({
    queryKey: ['tax-update', companyId],
    queryFn: () => taxUpdateService.getOverdue(companyId),
    enabled: !!companyId,
    staleTime: queryDefaults.standard,
  });
}
