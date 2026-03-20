import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { honorariosService } from '../services/honorarios.service';
import { queryDefaults } from '@/lib/query-defaults';

export function useContratos(companyId: string, status?: string) {
  return useQuery({
    queryKey: ['contratos', companyId, status],
    queryFn: () => honorariosService.getContratos(companyId, status),
    enabled: !!companyId,
    staleTime: queryDefaults.standard,
  });
}

export function useCreateContrato(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => honorariosService.createContrato(companyId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contratos'] }),
  });
}

export function useCobrancas(companyId: string, params?: Record<string, any>) {
  return useQuery({
    queryKey: ['cobrancas', companyId, params],
    queryFn: () => honorariosService.getCobrancas(companyId, params),
    enabled: !!companyId,
    staleTime: queryDefaults.standard,
  });
}

export function useMarkCobrancaPaid(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      honorariosService.markCobrancaPaid(companyId, id, new Date().toISOString()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cobrancas'] }),
  });
}

export function useGenerateBilling(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      honorariosService.generateBilling(companyId, year, month),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cobrancas'] }),
  });
}

export function useCashFlow(companyId: string, year: number) {
  return useQuery({
    queryKey: ['cash-flow', companyId, year],
    queryFn: () => honorariosService.getCashFlow(companyId, year),
    enabled: !!companyId && !!year,
    staleTime: queryDefaults.standard,
  });
}
