import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lalurService } from '../services/lalur.service';
import { queryDefaults } from '@/lib/query-defaults';

export function useLalurEntries(companyId: string, year: number, quarter?: number) {
  return useQuery({
    queryKey: ['lalur-entries', companyId, year, quarter],
    queryFn: () => lalurService.getEntries(companyId, year, quarter),
    enabled: !!companyId,
    staleTime: queryDefaults.standard,
  });
}

export function useCreateLalurEntry(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => lalurService.createEntry(companyId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lalur-entries'] }),
  });
}

export function useLalurBalances(companyId: string, year: number) {
  return useQuery({
    queryKey: ['lalur-balances', companyId, year],
    queryFn: () => lalurService.getBalances(companyId, year),
    enabled: !!companyId,
    staleTime: queryDefaults.standard,
  });
}

export function useCreateLalurBalance(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => lalurService.createBalance(companyId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lalur-balances'] }),
  });
}

export function useCalculateLucroReal(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      year,
      quarter,
      lucroContabil,
    }: {
      year: number;
      quarter: number;
      lucroContabil: string;
    }) => lalurService.calculate(companyId, year, quarter, lucroContabil),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lalur-entries'] });
      qc.invalidateQueries({ queryKey: ['lalur-balances'] });
    },
  });
}
