import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { TipoLancamento } from '@contabilita/shared';
import { auditTrailPlugin } from '../../../database/mongoose-plugins';

export type JournalEntryDocument = HydratedDocument<JournalEntry>;

/**
 * Linha de um lancamento contabil (partida dobrada).
 * Cada linha credita ou debita uma conta analitica.
 */
@Schema({ _id: false })
export class JournalEntryLine {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account', required: true })
  accountId: Types.ObjectId;

  @ApiProperty({ description: 'Valor a debito (Decimal128)' })
  @Prop({ type: MongooseSchema.Types.Decimal128, required: true, default: '0' })
  debit: Types.Decimal128;

  @ApiProperty({ description: 'Valor a credito (Decimal128)' })
  @Prop({ type: MongooseSchema.Types.Decimal128, required: true, default: '0' })
  credit: Types.Decimal128;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CostCenter' })
  costCenterId: Types.ObjectId;

  @ApiProperty({ description: 'Historico da linha' })
  @Prop({ required: true })
  historico: string;
}

export const JournalEntryLineSchema = SchemaFactory.createForClass(JournalEntryLine);

/**
 * Lancamento contabil - partida dobrada.
 * Regra fundamental: sum(debits) === sum(credits).
 */
@Schema({ timestamps: true, collection: 'journal_entries' })
export class JournalEntry {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Numero sequencial do lancamento' })
  @Prop({ required: true })
  numero: number;

  @ApiProperty({ description: 'Data do lancamento' })
  @Prop({ required: true, type: Date })
  date: Date;

  @ApiProperty({ enum: TipoLancamento })
  @Prop({ required: true, enum: Object.values(TipoLancamento), default: TipoLancamento.Manual })
  tipo: TipoLancamento;

  @ApiProperty()
  @Prop({ required: true })
  description: string;

  @ApiProperty({ type: [JournalEntryLine] })
  @Prop({ type: [JournalEntryLineSchema], required: true })
  lines: JournalEntryLine[];

  @ApiProperty({ description: 'Total de debitos (Decimal128)' })
  @Prop({ type: MongooseSchema.Types.Decimal128 })
  totalDebit: Types.Decimal128;

  @ApiProperty({ description: 'Total de creditos (Decimal128)' })
  @Prop({ type: MongooseSchema.Types.Decimal128 })
  totalCredit: Types.Decimal128;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'AccountingPeriod' })
  periodId: Types.ObjectId;

  // Plugin fields
  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
}

export const JournalEntrySchema = SchemaFactory.createForClass(JournalEntry);

JournalEntrySchema.plugin(auditTrailPlugin);

JournalEntrySchema.index({ tenantId: 1, companyId: 1, date: -1 });
JournalEntrySchema.index({ tenantId: 1, companyId: 1, numero: 1 }, { unique: true });
JournalEntrySchema.index({ 'lines.accountId': 1 });
