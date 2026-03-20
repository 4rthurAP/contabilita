import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { TipoRubrica } from '@contabilita/shared';

export type PayslipDocument = HydratedDocument<Payslip>;

@Schema({ _id: false })
export class PayslipLine {
  @Prop({ required: true })
  codigo: string;

  @Prop({ required: true })
  descricao: string;

  @Prop({ required: true, enum: Object.values(TipoRubrica) })
  tipo: TipoRubrica;

  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  referencia: Types.Decimal128; // Horas, dias, percentual

  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  valor: Types.Decimal128;
}

export const PayslipLineSchema = SchemaFactory.createForClass(PayslipLine);

/**
 * Holerite individual de um funcionario em uma folha.
 */
@Schema({ timestamps: true, collection: 'payslips' })
export class Payslip {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PayrollRun', required: true, index: true })
  payrollRunId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  employeeName: string;

  @ApiProperty()
  @Prop({ required: true })
  employeeCpf: string;

  @Prop({ type: [PayslipLineSchema], required: true })
  lines: PayslipLine[];

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  totalProventos: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  totalDescontos: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  salarioLiquido: Types.Decimal128;

  // Valores para encargos
  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  baseInss: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  valorInss: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  baseIrrf: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  valorIrrf: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  valorFgts: Types.Decimal128;
}

export const PayslipSchema = SchemaFactory.createForClass(Payslip);

PayslipSchema.index({ tenantId: 1, payrollRunId: 1, employeeId: 1 }, { unique: true });
