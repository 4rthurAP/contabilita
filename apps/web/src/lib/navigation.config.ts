import {
  LayoutDashboard,
  Building2,
  BookOpen,
  FileText,
  Users,
  Landmark,
  Package,
  Clock,
  Shield,
  ShieldCheck,
  Globe,
  Send,
  Settings,
  Search,
  Server,
  DollarSign,
  UserCheck,
  Calculator,
  Timer,
  FileBox,
  ClipboardList,
  ListTodo,
} from 'lucide-react';
import type { AppSubject } from '@contabilita/shared';

export interface NavChild {
  name: string;
  href: string;
  subject?: AppSubject;
}

export interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  subject: AppSubject;
  children?: NavChild[];
}

export const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard, subject: 'Dashboard' },
  { name: 'Empresas', href: '/app/companies', icon: Building2, subject: 'Company' },
  {
    name: 'Contabilidade',
    href: '/app/accounting',
    icon: BookOpen,
    subject: 'Account',
    children: [
      { name: 'Plano de Contas', href: '/app/accounting', subject: 'Account' },
      { name: 'Lancamentos', href: '/app/accounting/journal-entries', subject: 'JournalEntry' },
      { name: 'Razao', href: '/app/accounting/ledger', subject: 'JournalEntry' },
      { name: 'Balancete', href: '/app/accounting/trial-balance', subject: 'Report' },
      { name: 'Balanco Patrimonial', href: '/app/accounting/balanco', subject: 'Report' },
      { name: 'DRE', href: '/app/accounting/dre', subject: 'Report' },
    ],
  },
  {
    name: 'Escrita Fiscal',
    href: '/app/fiscal',
    icon: FileText,
    subject: 'FiscalInvoice',
    children: [
      { name: 'Notas Fiscais', href: '/app/fiscal/invoices', subject: 'FiscalInvoice' },
      { name: 'Apuracao', href: '/app/fiscal/assessment', subject: 'TaxAssessment' },
      { name: 'Guias', href: '/app/fiscal/payments', subject: 'TaxPayment' },
    ],
  },
  {
    name: 'Folha de Pagamento',
    href: '/app/payroll',
    icon: Users,
    subject: 'Payroll',
    children: [
      { name: 'Folhas Mensais', href: '/app/payroll/runs', subject: 'Payroll' },
      { name: 'Funcionarios', href: '/app/payroll/employees', subject: 'Employee' },
    ],
  },
  {
    name: 'LALUR',
    href: '/app/lalur',
    icon: Landmark,
    subject: 'Lalur',
    children: [
      { name: 'Lancamentos', href: '/app/lalur', subject: 'Lalur' },
      { name: 'Calculo Lucro Real', href: '/app/lalur/calculate', subject: 'Lalur' },
    ],
  },
  { name: 'Patrimonio', href: '/app/assets', icon: Package, subject: 'Asset' },
  { name: 'Atualizar', href: '/app/tax-update', icon: Clock, subject: 'TaxUpdate' },
  { name: 'Auditoria', href: '/app/audit', icon: Shield, subject: 'Audit' },
  {
    name: 'Honorarios',
    href: '/app/honorarios',
    icon: DollarSign,
    subject: 'Honorario',
    children: [
      { name: 'Contratos', href: '/app/honorarios/contratos', subject: 'Honorario' },
      { name: 'Cobrancas', href: '/app/honorarios/cobrancas', subject: 'Honorario' },
      { name: 'Fluxo de Caixa', href: '/app/honorarios/fluxo-caixa', subject: 'Honorario' },
    ],
  },
  { name: 'Portal Cliente', href: '/app/portal', icon: Globe, subject: 'ClientPortal' },
  { name: 'Portal Empregado', href: '/app/employee-portal', icon: UserCheck, subject: 'EmployeePortal' },
  { name: 'CCT', href: '/app/cct', icon: Calculator, subject: 'Cct' },
  {
    name: 'Custos',
    href: '/app/custos',
    icon: Timer,
    subject: 'Custo',
    children: [
      { name: 'Apontamento', href: '/app/custos/time-tracking', subject: 'Custo' },
      { name: 'Analise', href: '/app/custos/analysis', subject: 'Custo' },
    ],
  },
  { name: 'Obrigacoes', href: '/app/obligations', icon: Send, subject: 'Obligation' },
  { name: 'Protocolo', href: '/app/protocolo', icon: FileBox, subject: 'Protocolo' },
  { name: 'Registro', href: '/app/registro', icon: ClipboardList, subject: 'Registro' },
  {
    name: 'Administrar',
    href: '/app/administrar',
    icon: ListTodo,
    subject: 'Administrar',
    children: [
      { name: 'Tarefas', href: '/app/administrar/tarefas', subject: 'Administrar' },
      { name: 'Produtividade', href: '/app/administrar/produtividade', subject: 'Administrar' },
    ],
  },
  { name: 'Busca NF-e', href: '/app/busca-nfe', icon: Search, subject: 'BuscaNfe' },
  { name: 'Certificados', href: '/app/certificates', icon: ShieldCheck, subject: 'Certificate' },
  { name: 'Filas (Admin)', href: '/app/admin/queues', icon: Server, subject: 'QueueAdmin' },
  { name: 'Configuracoes', href: '/app/settings', icon: Settings, subject: 'Settings' },
];
