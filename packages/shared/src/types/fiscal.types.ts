import type { RegimeTributario, TipoNotaFiscal, TipoImposto } from '../enums/fiscal.enums.js';

export interface CompanyDto {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  regimeTributario: RegimeTributario;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  codigoNaturezaJuridica?: string;
}

export interface InvoiceItemDto {
  descricao: string;
  ncm: string;
  cfop: string;
  quantidade: string;
  valorUnitario: string;
  valorTotal: string;
  impostos: InvoiceItemTaxDto[];
}

export interface InvoiceItemTaxDto {
  tipo: TipoImposto;
  baseCalculo: string;
  aliquota: string;
  valor: string;
}

export interface InvoiceDto {
  tipo: TipoNotaFiscal;
  numero: string;
  serie: string;
  dataEmissao: string;
  companyId: string;
  fornecedorClienteId?: string;
  items: InvoiceItemDto[];
}
