import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { custosService } from '../services/custos.service';
import { queryDefaults } from '@/lib/query-defaults';

export function useTimeEntries(companyId: string, params?: Record<string, any>) {
  return useQuery({
    queryKey: ['time-entries', companyId, params],
    queryFn: () => custosService.getTimeEntries(companyId, params),
    enabled: !!companyId,
    staleTime: queryDefaults.standard,
  });
}

export function useCreateTimeEntry(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => custosService.createTimeEntry(companyId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time-entries'] }),
  });
}

export function useFixedCosts() {
  return useQuery({
    queryKey: ['fixed-costs'],
    queryFn: () => custosService.getFixedCosts(),
    staleTime: queryDefaults.standard,
  });
}

export function useCreateFixedCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => custosService.createFixedCost(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fixed-costs'] }),
  });
}

export function useCustosAnalysis(year: number, month: number) {
  return useQuery({
    queryKey: ['custos-analysis', year, month],
    queryFn: () => custosService.getAnalysis(year, month),
    enabled: !!year && !!month,
    staleTime: queryDefaults.standard,
  });
}
