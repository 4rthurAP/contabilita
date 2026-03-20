import { api } from '@/lib/api';

export interface InvoiceItem {
  descricao: string;
  ncm: string;
  cfop: string;
  quantidade: string;
  valorUnitario: string;
  valorTotal: string;
  impostos: { tipo: string; baseCalculo: string; aliquota: string; valor: string }[];
}

export interface Invoice {
  _id: string;
  tipo: string;
  numero: string;
  serie: string;
  dataEmissao: string;
  status: string;
  fornecedorClienteNome?: string;
  fornecedorClienteCnpj?: string;
  items: InvoiceItem[];
  totalProdutos: any;
  totalNota: any;
  totalIcms: any;
  totalPis: any;
  totalCofins: any;
  totalIss: any;
}

export interface TaxAssessment {
  _id: string;
  year: number;
  month: number;
  tipo: string;
  valorApurado: any;
  creditos: any;
  valorRecolher: any;
  isClosed: boolean;
}

export interface TaxPayment {
  _id: string;
  tipo: string;
  tipoGuia: string;
  competencia: string;
  dataVencimento: string;
  valorPrincipal: any;
  valorTotal: any;
  codigoReceita: string;
  status: string;
  dataPagamento?: string;
}

export const fiscalService = {
  // Invoices
  getInvoices: (companyId: string, params?: Record<string, any>) =>
    api.get(`/companies/${companyId}/invoices`, { params }).then((r) => r.data),

  createInvoice: (companyId: string, data: any) =>
    api.post(`/companies/${companyId}/invoices`, data).then((r) => r.data),

  importXml: (companyId: string, xml: string) =>
    api.post(`/companies/${companyId}/invoices/import-xml`, { xml }).then((r) => r.data),

  postInvoice: (companyId: string, id: string) =>
    api.patch(`/companies/${companyId}/invoices/${id}/post`).then((r) => r.data),

  cancelInvoice: (companyId: string, id: string) =>
    api.patch(`/companies/${companyId}/invoices/${id}/cancel`).then((r) => r.data),

  // Tax Assessments
  getAssessments: (companyId: string, year: number, month: number) =>
    api.get(`/companies/${companyId}/tax-assessments/${year}/${month}`).then((r) => r.data),

  recalculateAssessments: (companyId: string, year: number, month: number) =>
    api.post(`/companies/${companyId}/tax-assessments/${year}/${month}/recalculate`).then((r) => r.data),

  // Tax Payments
  getPayments: (companyId: string, status?: string) =>
    api.get(`/companies/${companyId}/tax-payments`, { params: { status } }).then((r) => r.data),

  generatePayments: (companyId: string, year: number, month: number) =>
    api.post(`/companies/${companyId}/tax-payments/generate/${year}/${month}`).then((r) => r.data),

  markPaid: (companyId: string, id: string, dataPagamento: string) =>
    api.patch(`/companies/${companyId}/tax-payments/${id}/pay`, { dataPagamento }).then((r) => r.data),
};
