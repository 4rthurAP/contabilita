import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService, Account } from '../services/accounting.service';
import { queryDefaults } from '@/lib/query-defaults';

export function useAccountTree(companyId: string) {
  return useQuery({
    queryKey: ['accounts', 'tree', companyId],
    queryFn: () => accountingService.getAccountTree(companyId),
    enabled: !!companyId,
    staleTime: queryDefaults.reference,
  });
}

export function useAnalyticalAccounts(companyId: string) {
  return useQuery({
    queryKey: ['accounts', 'analytical', companyId],
    queryFn: () => accountingService.getAnalyticalAccounts(companyId),
    enabled: !!companyId,
    staleTime: queryDefaults.reference,
  });
}

export function useCreateAccount(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Account>) => accountingService.createAccount(companyId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useJournalEntries(
  companyId: string,
  page = 1,
  startDate?: string,
  endDate?: string,
) {
  return useQuery({
    queryKey: ['journal-entries', companyId, page, startDate, endDate],
    queryFn: () =>
      accountingService.getJournalEntries(companyId, {
        page,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      }),
    enabled: !!companyId,
    staleTime: queryDefaults.reference,
  });
}

export function useCreateJournalEntry(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => accountingService.createJournalEntry(companyId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal-entries'] }),
  });
}

export function useLedger(
  companyId: string,
  accountId: string,
  startDate: string,
  endDate: string,
) {
  return useQuery({
    queryKey: ['ledger', companyId, accountId, startDate, endDate],
    queryFn: () => accountingService.getLedger(companyId, accountId, startDate, endDate),
    enabled: !!companyId && !!accountId && !!startDate && !!endDate,
    staleTime: queryDefaults.reference,
  });
}

export function useTrialBalance(companyId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['trial-balance', companyId, startDate, endDate],
    queryFn: () => accountingService.getTrialBalance(companyId, startDate, endDate),
    enabled: !!companyId && !!startDate && !!endDate,
    staleTime: queryDefaults.reference,
  });
}
