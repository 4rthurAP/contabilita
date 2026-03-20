import { api } from '@/lib/api';

export interface Employee {
  _id: string;
  nome: string;
  cpf: string;
  cargo: string;
  departamento?: string;
  salarioBase: any;
  dataAdmissao: string;
  status: string;
  dependentes?: { nome: string; cpf: string; parentesco: string; deducaoIrrf: boolean }[];
}

export interface PayrollRun {
  _id: string;
  year: number;
  month: number;
  tipo: string;
  status: string;
  totalBruto: any;
  totalDescontos: any;
  totalLiquido: any;
  totalInss: any;
  totalIrrf: any;
  totalFgts: any;
  totalFuncionarios: number;
}

export interface PayslipLine {
  codigo: string;
  descricao: string;
  tipo: string;
  referencia: any;
  valor: any;
}

export interface Payslip {
  _id: string;
  employeeName: string;
  employeeCpf: string;
  lines: PayslipLine[];
  totalProventos: any;
  totalDescontos: any;
  salarioLiquido: any;
  valorInss: any;
  valorIrrf: any;
  valorFgts: any;
}

export const payrollService = {
  // Employees
  getEmployees: (companyId: string, status?: string) =>
    api.get(`/companies/${companyId}/employees`, { params: { status } }).then((r) => r.data),

  createEmployee: (companyId: string, data: any) =>
    api.post(`/companies/${companyId}/employees`, data).then((r) => r.data),

  updateEmployee: (companyId: string, id: string, data: any) =>
    api.put(`/companies/${companyId}/employees/${id}`, data).then((r) => r.data),

  // Payroll Runs
  getPayrollRuns: (companyId: string, year?: number) =>
    api.get(`/companies/${companyId}/payroll-runs`, { params: { year } }).then((r) => r.data),

  createPayrollRun: (companyId: string, year: number, month: number) =>
    api.post(`/companies/${companyId}/payroll-runs/${year}/${month}`).then((r) => r.data),

  calculatePayroll: (companyId: string, id: string) =>
    api.patch(`/companies/${companyId}/payroll-runs/${id}/calculate`).then((r) => r.data),

  approvePayroll: (companyId: string, id: string) =>
    api.patch(`/companies/${companyId}/payroll-runs/${id}/approve`).then((r) => r.data),

  closePayroll: (companyId: string, id: string) =>
    api.patch(`/companies/${companyId}/payroll-runs/${id}/close`).then((r) => r.data),

  getPayslips: (companyId: string, runId: string) =>
    api.get(`/companies/${companyId}/payroll-runs/${runId}/payslips`).then((r) => r.data),
};
