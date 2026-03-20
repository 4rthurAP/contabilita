import { api } from '@/lib/api';
import type { TipoConta, NaturezaConta, TipoLancamento } from '@contabilita/shared';

export interface Account {
  _id: string;
  codigo: string;
  nome: string;
  tipo: TipoConta;
  natureza: NaturezaConta;
  nivel: number;
  parentId: string | null;
  isAnalytical: boolean;
  codigoReferencialRfb?: string;
  isActive: boolean;
  children?: Account[];
}

export interface JournalEntryLine {
  accountId: string | { _id: string; codigo: string; nome: string };
  debit: string;
  credit: string;
  costCenterId?: string;
  historico: string;
}

export interface JournalEntry {
  _id: string;
  numero: number;
  date: string;
  tipo: TipoLancamento;
  description: string;
  lines: JournalEntryLine[];
  totalDebit: string;
  totalCredit: string;
}

export interface LedgerMovement {
  date: string;
  numero: number;
  description: string;
  historico: string;
  debit: string;
  credit: string;
  saldo: string;
}

export interface LedgerResponse {
  account: { id: string; codigo: string; nome: string; natureza: string };
  startDate: string;
  endDate: string;
  movements: LedgerMovement[];
  saldoFinal: string;
}

export interface TrialBalanceAccount {
  accountId: string;
  codigo: string;
  nome: string;
  tipo: string;
  natureza: string;
  totalDebit: string;
  totalCredit: string;
  saldo: string;
  saldoNatureza: string;
}

export interface TrialBalanceResponse {
  startDate: string;
  endDate: string;
  accounts: TrialBalanceAccount[];
  totals: { totalDebit: string; totalCredit: string; balanced: boolean };
}

export const accountingService = {
  // ── Plano de Contas ──
  getAccounts: (companyId: string) =>
    api.get<Account[]>(`/companies/${companyId}/accounts`).then((r) => r.data),

  getAccountTree: (companyId: string) =>
    api.get<Account[]>(`/companies/${companyId}/accounts/tree`).then((r) => r.data),

  getAnalyticalAccounts: (companyId: string) =>
    api.get<Account[]>(`/companies/${companyId}/accounts/analytical`).then((r) => r.data),

  createAccount: (companyId: string, data: Partial<Account>) =>
    api.post<Account>(`/companies/${companyId}/accounts`, data).then((r) => r.data),

  updateAccount: (companyId: string, id: string, data: Partial<Account>) =>
    api.put<Account>(`/companies/${companyId}/accounts/${id}`, data).then((r) => r.data),

  deleteAccount: (companyId: string, id: string) =>
    api.delete(`/companies/${companyId}/accounts/${id}`),

  // ── Lancamentos ──
  getJournalEntries: (companyId: string, params?: Record<string, string | number>) =>
    api
      .get(`/companies/${companyId}/journal-entries`, { params })
      .then((r) => r.data),

  getJournalEntry: (companyId: string, id: string) =>
    api.get<JournalEntry>(`/companies/${companyId}/journal-entries/${id}`).then((r) => r.data),

  createJournalEntry: (companyId: string, data: any) =>
    api.post<JournalEntry>(`/companies/${companyId}/journal-entries`, data).then((r) => r.data),

  // ── Relatorios ──
  getLedger: (companyId: string, accountId: string, startDate: string, endDate: string) =>
    api
      .get<LedgerResponse>(`/companies/${companyId}/journal-entries/reports/ledger/${accountId}`, {
        params: { startDate, endDate },
      })
      .then((r) => r.data),

  getTrialBalance: (companyId: string, startDate: string, endDate: string) =>
    api
      .get<TrialBalanceResponse>(`/companies/${companyId}/journal-entries/reports/trial-balance`, {
        params: { startDate, endDate },
      })
      .then((r) => r.data),
};
