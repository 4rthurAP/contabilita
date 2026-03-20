import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../services/reports.service';
import { queryDefaults } from '@/lib/query-defaults';

export function useBalancoPatrimonial(companyId: string, endDate: string) {
  return useQuery({
    queryKey: ['balanco', companyId, endDate],
    queryFn: () => reportsService.getBalancoPatrimonial(companyId, endDate),
    enabled: !!companyId && !!endDate,
    staleTime: queryDefaults.standard,
  });
}

export function useDre(companyId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['dre', companyId, startDate, endDate],
    queryFn: () => reportsService.getDre(companyId, startDate, endDate),
    enabled: !!companyId,
    staleTime: queryDefaults.standard,
  });
}
