import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { tenantScopedPlugin } from '../../../database/mongoose-plugins/tenant-scoped.plugin';
import { auditTrailPlugin } from '../../../database/mongoose-plugins/audit-trail.plugin';

export type BankTransactionDocument = HydratedDocument<BankTransaction>;

export enum BankTransactionStatus {
  Pendente = 'pendente',
  Conciliada = 'conciliada',
  Ignorada = 'ignorada',
}

@Schema({ timestamps: true, collection: 'bank_transactions' })
export class BankTransaction {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  bankAccountId: MongooseSchema.Types.ObjectId;

  /** FITID (Financial Institution Transaction ID) — usado para dedup */
  @ApiProperty({ description: 'Identificador unico da transacao no banco' })
  @Prop({ required: true })
  fitid: string;

  @ApiProperty()
  @Prop({ type: Date, required: true })
  date: Date;

  @ApiProperty({ description: 'Valor da transacao (positivo=credito, negativo=debito)' })
  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  amount: Types.Decimal128;

  @ApiProperty({ description: 'Descricao/memo do extrato' })
  @Prop({ required: true })
  memo: string;

  @ApiProperty({ description: 'Tipo da transacao OFX (DEBIT, CREDIT, etc.)' })
  @Prop()
  type: string;

  @ApiProperty({ description: 'CNPJ/CPF do pagador ou recebedor (quando disponivel)' })
  @Prop()
  counterpartDocument?: string;

  @ApiProperty({ enum: BankTransactionStatus })
  @Prop({
    required: true,
    enum: BankTransactionStatus,
    default: BankTransactionStatus.Pendente,
  })
  status: BankTransactionStatus;

  /** ID do lancamento contabil gerado pela conciliacao */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'JournalEntry' })
  journalEntryId?: MongooseSchema.Types.ObjectId;

  /** ID da nota fiscal associada (quando conciliado com NF) */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Invoice' })
  invoiceId?: MongooseSchema.Types.ObjectId;

  /** Origem da importacao */
  @Prop({ default: 'ofx' })
  source: string;
}

export const BankTransactionSchema = SchemaFactory.createForClass(BankTransaction);
BankTransactionSchema.plugin(tenantScopedPlugin);
BankTransactionSchema.plugin(auditTrailPlugin);
BankTransactionSchema.index({ tenantId: 1, bankAccountId: 1, fitid: 1 }, { unique: true });
BankTransactionSchema.index({ tenantId: 1, companyId: 1, date: -1, status: 1 });
