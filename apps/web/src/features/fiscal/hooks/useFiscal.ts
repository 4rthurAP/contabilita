import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fiscalService } from '../services/fiscal.service';
import { queryDefaults } from '@/lib/query-defaults';

export function useInvoices(companyId: string, page = 1, tipo?: string) {
  return useQuery({
    queryKey: ['invoices', companyId, page, tipo],
    queryFn: () => fiscalService.getInvoices(companyId, { page, tipo }),
    enabled: !!companyId,
    staleTime: queryDefaults.standard,
  });
}

export function useCreateInvoice(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fiscalService.createInvoice(companyId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useImportXml(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (xml: string) => fiscalService.importXml(companyId, xml),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function usePostInvoice(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fiscalService.postInvoice(companyId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['tax-assessments'] });
    },
  });
}

export function useTaxAssessments(companyId: string, year: number, month: number) {
  return useQuery({
    queryKey: ['tax-assessments', companyId, year, month],
    queryFn: () => fiscalService.getAssessments(companyId, year, month),
    enabled: !!companyId && !!year && !!month,
    staleTime: queryDefaults.standard,
  });
}

export function useRecalculateAssessments(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      fiscalService.recalculateAssessments(companyId, year, month),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tax-assessments'] }),
  });
}

export function useTaxPayments(companyId: string, status?: string) {
  return useQuery({
    queryKey: ['tax-payments', companyId, status],
    queryFn: () => fiscalService.getPayments(companyId, status),
    enabled: !!companyId,
    staleTime: queryDefaults.standard,
  });
}

export function useMarkPaid(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fiscalService.markPaid(companyId, id, new Date().toISOString()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tax-payments'] }),
  });
}

export function useGeneratePayments(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      fiscalService.generatePayments(companyId, year, month),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tax-payments'] }),
  });
}
