import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { CompaniesPage } from '@/features/companies/pages/CompaniesPage';
import { CompanyFormPage } from '@/features/companies/pages/CompanyFormPage';
import { ChartOfAccountsPage } from '@/features/accounting/pages/ChartOfAccountsPage';
import { JournalEntriesPage } from '@/features/accounting/pages/JournalEntriesPage';
import { JournalEntryFormPage } from '@/features/accounting/pages/JournalEntryFormPage';
import { LedgerPage } from '@/features/accounting/pages/LedgerPage';
import { TrialBalancePage } from '@/features/accounting/pages/TrialBalancePage';
import { InvoicesPage } from '@/features/fiscal/pages/InvoicesPage';
import { TaxAssessmentPage } from '@/features/fiscal/pages/TaxAssessmentPage';
import { TaxPaymentsPage } from '@/features/fiscal/pages/TaxPaymentsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />

        {/* Empresas */}
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="companies/new" element={<CompanyFormPage />} />
        <Route path="companies/:id/edit" element={<CompanyFormPage />} />

        {/* Contabilidade */}
        <Route path="accounting" element={<ChartOfAccountsPage />} />
        <Route path="accounting/journal-entries" element={<JournalEntriesPage />} />
        <Route path="accounting/journal-entries/new" element={<JournalEntryFormPage />} />
        <Route path="accounting/ledger" element={<LedgerPage />} />
        <Route path="accounting/trial-balance" element={<TrialBalancePage />} />

        {/* Escrita Fiscal */}
        <Route path="fiscal" element={<InvoicesPage />} />
        <Route path="fiscal/invoices" element={<InvoicesPage />} />
        <Route path="fiscal/assessment" element={<TaxAssessmentPage />} />
        <Route path="fiscal/payments" element={<TaxPaymentsPage />} />
      </Route>
    </Routes>
  );
}
