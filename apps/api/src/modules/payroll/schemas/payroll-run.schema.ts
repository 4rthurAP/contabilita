import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { StatusFolha, TipoFolha } from '@contabilita/shared';
import { auditTrailPlugin } from '../../../database/mongoose-plugins';

export type PayrollRunDocument = HydratedDocument<PayrollRun>;

/**
 * Execucao de folha de pagamento mensal.
 * Workflow: rascunho -> calculada -> aprovada -> fechada
 */
@Schema({ timestamps: true, collection: 'payroll_runs' })
export class PayrollRun {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  year: number;

  @ApiProperty()
  @Prop({ required: true, min: 1, max: 12 })
  month: number;

  @ApiProperty({ enum: TipoFolha })
  @Prop({ required: true, enum: Object.values(TipoFolha), default: TipoFolha.Mensal })
  tipo: TipoFolha;

  @ApiProperty({ enum: StatusFolha })
  @Prop({ required: true, enum: Object.values(StatusFolha), default: StatusFolha.Rascunho })
  status: StatusFolha;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  totalBruto: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  totalDescontos: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  totalLiquido: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  totalInss: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  totalIrrf: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  totalFgts: Types.Decimal128;

  @Prop({ default: 0 })
  totalFuncionarios: number;

  @Prop({ type: Date })
  calculatedAt: Date;

  @Prop({ type: Date })
  approvedAt: Date;

  @Prop({ type: Date })
  closedAt: Date;

  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
}

export const PayrollRunSchema = SchemaFactory.createForClass(PayrollRun);

PayrollRunSchema.plugin(auditTrailPlugin);

PayrollRunSchema.index(
  { tenantId: 1, companyId: 1, year: 1, month: 1, tipo: 1 },
  { unique: true },
);
