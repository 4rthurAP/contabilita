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
import { CertificatesPage } from '@/features/certificates/pages/CertificatesPage';
import { QueuesPage } from '@/features/admin/pages/QueuesPage';
import { NotFoundPage } from '@/features/errors/NotFoundPage';
import { PermissionGate } from '@/components/auth/PermissionGate';

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
        <Route path="companies" element={<PermissionGate action="read" subject="Company"><CompaniesPage /></PermissionGate>} />
        <Route path="companies/new" element={<PermissionGate action="create" subject="Company"><CompanyFormPage /></PermissionGate>} />
        <Route path="companies/:id/edit" element={<PermissionGate action="update" subject="Company"><CompanyFormPage /></PermissionGate>} />

        {/* Contabilidade */}
        <Route path="accounting" element={<PermissionGate action="read" subject="Account"><ChartOfAccountsPage /></PermissionGate>} />
        <Route path="accounting/journal-entries" element={<PermissionGate action="read" subject="JournalEntry"><JournalEntriesPage /></PermissionGate>} />
        <Route path="accounting/journal-entries/new" element={<PermissionGate action="create" subject="JournalEntry"><JournalEntryFormPage /></PermissionGate>} />
        <Route path="accounting/ledger" element={<PermissionGate action="read" subject="JournalEntry"><LedgerPage /></PermissionGate>} />
        <Route path="accounting/trial-balance" element={<PermissionGate action="read" subject="Account"><TrialBalancePage /></PermissionGate>} />

        {/* Escrita Fiscal */}
        <Route path="fiscal" element={<Navigate to="invoices" replace />} />
        <Route path="fiscal/invoices" element={<PermissionGate action="read" subject="FiscalInvoice"><InvoicesPage /></PermissionGate>} />
        <Route path="fiscal/assessment" element={<PermissionGate action="read" subject="TaxAssessment"><TaxAssessmentPage /></PermissionGate>} />
        <Route path="fiscal/payments" element={<PermissionGate action="read" subject="TaxPayment"><TaxPaymentsPage /></PermissionGate>} />

        {/* Folha de Pagamento */}
        <Route path="payroll" element={<Navigate to="runs" replace />} />
        <Route path="payroll/employees" element={<PermissionGate action="read" subject="Employee"><EmployeesPage /></PermissionGate>} />
        <Route path="payroll/runs" element={<PermissionGate action="read" subject="Payroll"><PayrollRunsPage /></PermissionGate>} />

        {/* Patrimonio */}
        <Route path="assets" element={<PermissionGate action="read" subject="Asset"><AssetsPage /></PermissionGate>} />

        {/* Relatorios */}
        <Route path="accounting/balanco" element={<PermissionGate action="read" subject="Report"><BalancoPatrimonialPage /></PermissionGate>} />
        <Route path="accounting/dre" element={<PermissionGate action="read" subject="Report"><DREPage /></PermissionGate>} />

        {/* Obrigacoes Acessorias */}
        <Route path="obligations" element={<PermissionGate action="read" subject="Obligation"><ObligationsPage /></PermissionGate>} />

        {/* Atualizar Impostos */}
        <Route path="tax-update" element={<PermissionGate action="read" subject="TaxUpdate"><TaxUpdatePage /></PermissionGate>} />

        {/* LALUR */}
        <Route path="lalur" element={<PermissionGate action="read" subject="Lalur"><LalurPage /></PermissionGate>} />
        <Route path="lalur/calculate" element={<PermissionGate action="read" subject="Lalur"><LalurCalcPage /></PermissionGate>} />

        {/* Portal do Cliente */}
        <Route path="portal" element={<PermissionGate action="read" subject="ClientPortal"><ClientPortalPage /></PermissionGate>} />

        {/* Auditoria */}
        <Route path="audit" element={<PermissionGate action="read" subject="Audit"><AuditPage /></PermissionGate>} />

        {/* Registro */}
        <Route path="registro" element={<PermissionGate action="read" subject="Registro"><RegistroPage /></PermissionGate>} />
        <Route path="registro/:id" element={<PermissionGate action="read" subject="Registro"><RegistroDetailPage /></PermissionGate>} />

        {/* Administrar */}
        <Route path="administrar" element={<Navigate to="tarefas" replace />} />
        <Route path="administrar/tarefas" element={<PermissionGate action="read" subject="Administrar"><TarefasPage /></PermissionGate>} />
        <Route path="administrar/produtividade" element={<PermissionGate action="read" subject="Administrar"><ProdutividadePage /></PermissionGate>} />

        {/* Honorarios */}
        <Route path="honorarios" element={<Navigate to="contratos" replace />} />
        <Route path="honorarios/contratos" element={<PermissionGate action="read" subject="Honorario"><ContratosPage /></PermissionGate>} />
        <Route path="honorarios/cobrancas" element={<PermissionGate action="read" subject="Honorario"><CobrancasPage /></PermissionGate>} />
        <Route path="honorarios/fluxo-caixa" element={<PermissionGate action="read" subject="Honorario"><FluxoCaixaPage /></PermissionGate>} />

        {/* Portal do Empregado */}
        <Route path="employee-portal" element={<PermissionGate action="read" subject="EmployeePortal"><EmployeePortalPage /></PermissionGate>} />

        {/* CCT */}
        <Route path="cct" element={<PermissionGate action="read" subject="Cct"><CctPage /></PermissionGate>} />

        {/* Custos */}
        <Route path="custos" element={<Navigate to="time-tracking" replace />} />
        <Route path="custos/time-tracking" element={<PermissionGate action="read" subject="Custo"><TimeTrackingPage /></PermissionGate>} />
        <Route path="custos/analysis" element={<PermissionGate action="read" subject="Custo"><CustosAnalysisPage /></PermissionGate>} />

        {/* Protocolo */}
        <Route path="protocolo" element={<PermissionGate action="read" subject="Protocolo"><ProtocoloPage /></PermissionGate>} />

        {/* Busca NF-e */}
        <Route path="busca-nfe" element={<PermissionGate action="read" subject="BuscaNfe"><BuscaNfePage /></PermissionGate>} />

        {/* Certificados Digitais */}
        <Route path="certificates" element={<PermissionGate action="read" subject="Certificate"><CertificatesPage /></PermissionGate>} />

        {/* Admin */}
        <Route path="admin/queues" element={<PermissionGate action="read" subject="QueueAdmin"><QueuesPage /></PermissionGate>} />

        {/* 404 dentro do app */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* 404 global */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
