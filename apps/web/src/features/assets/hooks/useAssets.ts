import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsService } from '../services/assets.service';
import { queryDefaults } from '@/lib/query-defaults';

export function useAssets(companyId: string) {
  return useQuery({
    queryKey: ['assets', companyId],
    queryFn: () => assetsService.getAssets(companyId),
    enabled: !!companyId,
    staleTime: queryDefaults.standard,
  });
}

export function useDepreciateAssets(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      assetsService.depreciateMonth(companyId, year, month),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });
}
