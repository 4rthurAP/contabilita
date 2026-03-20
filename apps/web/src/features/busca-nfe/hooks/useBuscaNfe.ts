import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buscaNfeService } from '../services/busca-nfe.service';
import { queryDefaults } from '@/lib/query-defaults';

export function useBuscaNfeHistory(companyId: string) {
  return useQuery({
    queryKey: ['busca-nfe-history', companyId],
    queryFn: () => buscaNfeService.getHistory(companyId),
    enabled: !!companyId,
    staleTime: queryDefaults.standard,
  });
}

export function useFetchNfe(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => buscaNfeService.fetch(companyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['busca-nfe-history'] }),
  });
}
