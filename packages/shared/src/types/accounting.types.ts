import type { TipoConta, NaturezaConta, TipoLancamento } from '../enums/accounting.enums.js';

export interface AccountDto {
  codigo: string;
  nome: string;
  tipo: TipoConta;
  natureza: NaturezaConta;
  nivel: number;
  parentId?: string;
  isAnalytical: boolean;
  codigoReferencialRfb?: string;
}

export interface JournalEntryLineDto {
  accountId: string;
  debit: string; // Decimal128 serialized as string
  credit: string;
  costCenterId?: string;
  historico: string;
}

export interface JournalEntryDto {
  date: string; // ISO date
  tipo: TipoLancamento;
  description: string;
  lines: JournalEntryLineDto[];
}
