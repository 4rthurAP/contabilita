import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { LandingPage } from '@/features/landing/pages/LandingPage';
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
import { EmployeesPage } from '@/features/payroll/pages/EmployeesPage';
import { PayrollRunsPage } from '@/features/payroll/pages/PayrollRunsPage';
import { AssetsPage } from '@/features/assets/pages/AssetsPage';
import { BalancoPatrimonialPage } from '@/features/accounting/pages/BalancoPatrimonialPage';
import { DREPage } from '@/features/accounting/pages/DREPage';
import { ObligationsPage } from '@/features/obligations/pages/ObligationsPage';
import { TaxUpdatePage } from '@/features/tax-update/pages/TaxUpdatePage';
import { AuditPage } from '@/features/audit/pages/AuditPage';
import { LalurPage } from '@/features/lalur/pages/LalurPage';
import { LalurCalcPage } from '@/features/lalur/pages/LalurCalcPage';
import { ClientPortalPage } from '@/features/client-portal/pages/ClientPortalPage';
import { RegistroPage } from '@/features/registro/pages/RegistroPage';
import { RegistroDetailPage } from '@/features/registro/pages/RegistroDetailPage';
import { TarefasPage } from '@/features/administrar/pages/TarefasPage';
import { ProdutividadePage } from '@/features/administrar/pages/ProdutividadePage';
import { BuscaNfePage } from '@/features/busca-nfe/pages/BuscaNfePage';
import { ContratosPage } from '@/features/honorarios/pages/ContratosPage';
import { CobrancasPage } from '@/features/honorarios/pages/CobrancasPage';
import { FluxoCaixaPage } from '@/features/honorarios/pages/FluxoCaixaPage';
import { EmployeePortalPage } from '@/features/employee-portal/pages/EmployeePortalPage';
import { CctPage } from '@/features/cct/pages/CctPage';
import { TimeTrackingPage } from '@/features/custos/pages/TimeTrackingPage';
import { CustosAnalysisPage } from '@/features/custos/pages/CustosAnalysisPage';
import { ProtocoloPage } from '@/features/protocolo/pages/ProtocoloPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/app"
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
        <Route path="fiscal" element={<Navigate to="invoices" replace />} />
        <Route path="fiscal/invoices" element={<InvoicesPage />} />
        <Route path="fiscal/assessment" element={<TaxAssessmentPage />} />
        <Route path="fiscal/payments" element={<TaxPaymentsPage />} />

        {/* Folha de Pagamento */}
        <Route path="payroll" element={<Navigate to="runs" replace />} />
        <Route path="payroll/employees" element={<EmployeesPage />} />
        <Route path="payroll/runs" element={<PayrollRunsPage />} />

        {/* Patrimonio */}
        <Route path="assets" element={<AssetsPage />} />

        {/* Relatorios */}
        <Route path="accounting/balanco" element={<BalancoPatrimonialPage />} />
        <Route path="accounting/dre" element={<DREPage />} />

        {/* Obrigacoes Acessorias */}
        <Route path="obligations" element={<ObligationsPage />} />

        {/* Atualizar Impostos */}
        <Route path="tax-update" element={<TaxUpdatePage />} />

        {/* LALUR */}
        <Route path="lalur" element={<LalurPage />} />
        <Route path="lalur/calculate" element={<LalurCalcPage />} />

        {/* Portal do Cliente */}
        <Route path="portal" element={<ClientPortalPage />} />

        {/* Auditoria */}
        <Route path="audit" element={<AuditPage />} />

        {/* Registro */}
        <Route path="registro" element={<RegistroPage />} />
        <Route path="registro/:id" element={<RegistroDetailPage />} />

        {/* Administrar */}
        <Route path="administrar" element={<Navigate to="tarefas" replace />} />
        <Route path="administrar/tarefas" element={<TarefasPage />} />
        <Route path="administrar/produtividade" element={<ProdutividadePage />} />

        {/* Honorarios */}
        <Route path="honorarios" element={<Navigate to="contratos" replace />} />
        <Route path="honorarios/contratos" element={<ContratosPage />} />
        <Route path="honorarios/cobrancas" element={<CobrancasPage />} />
        <Route path="honorarios/fluxo-caixa" element={<FluxoCaixaPage />} />

        {/* Portal do Empregado */}
        <Route path="employee-portal" element={<EmployeePortalPage />} />

        {/* CCT */}
        <Route path="cct" element={<CctPage />} />

        {/* Custos */}
        <Route path="custos" element={<Navigate to="time-tracking" replace />} />
        <Route path="custos/time-tracking" element={<TimeTrackingPage />} />
        <Route path="custos/analysis" element={<CustosAnalysisPage />} />

        {/* Protocolo */}
        <Route path="protocolo" element={<ProtocoloPage />} />

        {/* Busca NF-e */}
        <Route path="busca-nfe" element={<BuscaNfePage />} />
      </Route>
    </Routes>
  );
}
