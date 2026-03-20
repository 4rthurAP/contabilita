import { Check, Clock, FileCheck, AlertTriangle } from 'lucide-react';

/**
 * StatusConfig interface matches StatusBadge component expectations.
 */
export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface StatusConfig {
  label: string;
  variant: StatusVariant;
  icon?: typeof Check;
}

// --- Assets ---
export const ASSET_STATUS_MAP: Record<string, StatusConfig> = {
  ativo: { label: 'Ativo', variant: 'success' },
  baixado: { label: 'Baixado', variant: 'danger' },
  transferido: { label: 'Transferido', variant: 'info' },
};

// --- Audit ---
export const AUDIT_ACTION_MAP: Record<string, StatusConfig> = {
  create: { label: 'create', variant: 'success' },
  update: { label: 'update', variant: 'info' },
  delete: { label: 'delete', variant: 'danger' },
  login: { label: 'login', variant: 'neutral' },
  action: { label: 'action', variant: 'warning' },
};

// --- Employees ---
export const EMPLOYEE_STATUS_MAP: Record<string, StatusConfig> = {
  ativo: { label: 'Ativo', variant: 'success' },
  afastado: { label: 'Afastado', variant: 'warning' },
  ferias: { label: 'Ferias', variant: 'info' },
  demitido: { label: 'Demitido', variant: 'danger' },
};

// --- Fiscal: Tax Assessment ---
export const IMPOSTO_LABELS: Record<string, string> = {
  icms: 'ICMS',
  ipi: 'IPI',
  pis: 'PIS',
  cofins: 'COFINS',
  iss: 'ISS',
  irpj: 'IRPJ',
  csll: 'CSLL',
};

// --- Fiscal: Invoices ---
export const INVOICE_STATUS_MAP: Record<string, StatusConfig> = {
  rascunho: { label: 'Rascunho', variant: 'warning' },
  escriturada: { label: 'Escriturada', variant: 'success' },
  cancelada: { label: 'Cancelada', variant: 'danger' },
};

export const INVOICE_TIPO_OPTIONS = [
  { value: 'entrada' as const, label: 'Entrada' },
  { value: 'saida' as const, label: 'Saida' },
];

// --- Obligations ---
export const OBLIGATION_STATUS_MAP: Record<string, StatusConfig> = {
  pendente: { label: 'Pendente', variant: 'warning', icon: Clock },
  gerada: { label: 'Gerada', variant: 'info', icon: FileCheck },
  validada: { label: 'Validada', variant: 'info', icon: FileCheck },
  transmitida: { label: 'Transmitida', variant: 'success', icon: Check },
  retificada: { label: 'Retificada', variant: 'danger', icon: AlertTriangle },
};

// --- Fiscal: Tax Payments ---
export const PAYMENT_STATUS_MAP: Record<string, StatusConfig> = {
  pendente: { label: 'Pendente', variant: 'warning' },
  paga: { label: 'Paga', variant: 'success' },
  vencida: { label: 'Vencida', variant: 'danger' },
};

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'pendente' as const, label: 'Pendentes' },
  { value: 'paga' as const, label: 'Pagas' },
  { value: 'vencida' as const, label: 'Vencidas' },
];

// --- Payroll ---
export const PAYROLL_STATUS_MAP: Record<string, StatusConfig> = {
  rascunho: { label: 'Rascunho', variant: 'neutral' },
  calculada: { label: 'Calculada', variant: 'info' },
  aprovada: { label: 'Aprovada', variant: 'success' },
  fechada: { label: 'Fechada', variant: 'warning' },
};

// --- Companies ---
export const REGIME_LABELS: Record<string, string> = {
  simples_nacional: 'Simples Nacional',
  lucro_presumido: 'Lucro Presumido',
  lucro_real: 'Lucro Real',
  imune: 'Imune',
  isenta: 'Isenta',
};

export const REGIME_OPTIONS = [
  { value: 'simples_nacional', label: 'Simples Nacional' },
  { value: 'lucro_presumido', label: 'Lucro Presumido' },
  { value: 'lucro_real', label: 'Lucro Real' },
  { value: 'imune', label: 'Imune' },
  { value: 'isenta', label: 'Isenta' },
];

// --- Registro ---
export const REGISTRO_STATUS_MAP: Record<string, StatusConfig> = {
  rascunho: { label: 'Rascunho', variant: 'neutral' },
  em_analise: { label: 'Em Analise', variant: 'warning', icon: Clock },
  protocolado: { label: 'Protocolado', variant: 'info', icon: FileCheck },
  deferido: { label: 'Deferido', variant: 'success', icon: Check },
  indeferido: { label: 'Indeferido', variant: 'danger', icon: AlertTriangle },
};

export const REGISTRO_STATUS_OPTIONS = [
  { value: 'rascunho' as const, label: 'Rascunhos' },
  { value: 'em_analise' as const, label: 'Em Analise' },
  { value: 'protocolado' as const, label: 'Protocolados' },
  { value: 'deferido' as const, label: 'Deferidos' },
  { value: 'indeferido' as const, label: 'Indeferidos' },
];

// --- Tarefas (Administrar) ---
export const TAREFA_STATUS_MAP: Record<string, StatusConfig> = {
  pendente: { label: 'Pendente', variant: 'warning', icon: Clock },
  em_andamento: { label: 'Em Andamento', variant: 'info' },
  concluida: { label: 'Concluida', variant: 'success', icon: Check },
};

export const TAREFA_STATUS_OPTIONS = [
  { value: 'pendente' as const, label: 'Pendentes' },
  { value: 'em_andamento' as const, label: 'Em Andamento' },
  { value: 'concluida' as const, label: 'Concluidas' },
];

export const TAREFA_PRIORIDADE_MAP: Record<string, StatusConfig> = {
  baixa: { label: 'Baixa', variant: 'neutral' },
  media: { label: 'Media', variant: 'info' },
  alta: { label: 'Alta', variant: 'warning', icon: AlertTriangle },
  urgente: { label: 'Urgente', variant: 'danger', icon: AlertTriangle },
};

export const TAREFA_PRIORIDADE_OPTIONS = [
  { value: 'baixa' as const, label: 'Baixa' },
  { value: 'media' as const, label: 'Media' },
  { value: 'alta' as const, label: 'Alta' },
  { value: 'urgente' as const, label: 'Urgente' },
];

// --- Honorarios: Contratos ---
export const CONTRATO_STATUS_MAP: Record<string, StatusConfig> = {
  ativo: { label: 'Ativo', variant: 'success' },
  suspenso: { label: 'Suspenso', variant: 'warning' },
  cancelado: { label: 'Cancelado', variant: 'danger' },
};

export const CONTRATO_STATUS_OPTIONS = [
  { value: 'ativo' as const, label: 'Ativos' },
  { value: 'suspenso' as const, label: 'Suspensos' },
  { value: 'cancelado' as const, label: 'Cancelados' },
];

// --- Honorarios: Cobrancas ---
export const COBRANCA_STATUS_MAP: Record<string, StatusConfig> = {
  pendente: { label: 'Pendente', variant: 'warning' },
  paga: { label: 'Paga', variant: 'success' },
  vencida: { label: 'Vencida', variant: 'danger' },
  cancelada: { label: 'Cancelada', variant: 'neutral' },
};

export const COBRANCA_STATUS_OPTIONS = [
  { value: 'pendente' as const, label: 'Pendentes' },
  { value: 'paga' as const, label: 'Pagas' },
  { value: 'vencida' as const, label: 'Vencidas' },
  { value: 'cancelada' as const, label: 'Canceladas' },
];

// --- Protocolo ---
export const PROTOCOLO_STATUS_MAP: Record<string, StatusConfig> = {
  registrado: { label: 'Registrado', variant: 'info' },
  em_andamento: { label: 'Em Andamento', variant: 'warning', icon: Clock },
  concluido: { label: 'Concluido', variant: 'success', icon: Check },
  devolvido: { label: 'Devolvido', variant: 'danger' },
};

export const PROTOCOLO_STATUS_OPTIONS = [
  { value: 'registrado' as const, label: 'Registrados' },
  { value: 'em_andamento' as const, label: 'Em Andamento' },
  { value: 'concluido' as const, label: 'Concluidos' },
  { value: 'devolvido' as const, label: 'Devolvidos' },
];

export const PROTOCOLO_TIPO_MAP: Record<string, StatusConfig> = {
  entrada: { label: 'Entrada', variant: 'info' },
  saida: { label: 'Saida', variant: 'success' },
};

// --- Trial Balance ---
export const TIPO_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  passivo: 'Passivo',
  patrimonio_liquido: 'PL',
  receita: 'Receita',
  despesa: 'Despesa',
};
