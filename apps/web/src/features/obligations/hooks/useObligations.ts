import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { obligationsService } from '../services/obligations.service';

export function useObligations(companyId: string, year: number) {
  return useQuery({
    queryKey: ['obligations', companyId, year],
    queryFn: () => obligationsService.getObligations(companyId, year),
    enabled: !!companyId,
  });
}

export function useGenerateMonthly(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      obligationsService.generateMonthly(companyId, year, month),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obligations'] }),
  });
}

export function useGenerateAnnual(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (year: number) => obligationsService.generateAnnual(companyId, year),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obligations'] }),
  });
}

export function useGenerateSpedEcd(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (year: number) => obligationsService.generateSpedEcd(companyId, year),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obligations'] }),
  });
}

export function useGenerateSpedEfd(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      obligationsService.generateSpedEfd(companyId, year, month),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obligations'] }),
  });
}
