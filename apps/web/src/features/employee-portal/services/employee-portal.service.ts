import { api } from '@/lib/api';

export interface EmployeeProfile {
  _id: string;
  nome: string;
  cpf: string;
  cargo: string;
  departamento?: string;
  salarioBase: any;
  dataAdmissao: string;
  status: string;
  empresaNome?: string;
}

export interface MyPayslip {
  _id: string;
  year: number;
  month: number;
  salarioBruto: any;
  salarioLiquido: any;
  totalDescontos: any;
  valorInss: any;
  valorIrrf: any;
  valorFgts: any;
  lines?: { codigo: string; descricao: string; tipo: string; referencia: any; valor: any }[];
}

export const employeePortalService = {
  getProfile: () =>
    api.get('/employee-portal/profile').then((r) => r.data),

  getPayslips: () =>
    api.get('/employee-portal/payslips').then((r) => r.data),

  getPayslipDetail: (id: string) =>
    api.get(`/employee-portal/payslips/${id}`).then((r) => r.data),
};
