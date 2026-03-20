import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusContrato, PeriodicidadeContrato } from '@contabilita/shared';
import { auditTrailPlugin, softDeletePlugin } from '../../../database/mongoose-plugins';

export type ContratoDocument = HydratedDocument<Contrato>;

@Schema({ timestamps: true, collection: 'contratos' })
export class Contrato {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  descricao: string;

  @ApiProperty({ description: 'Valor mensal do contrato' })
  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  valorMensal: Types.Decimal128;

  @ApiProperty()
  @Prop({ required: true, type: Date })
  dataInicio: Date;

  @ApiPropertyOptional()
  @Prop({ type: Date })
  dataFim: Date;

  @ApiProperty({ enum: StatusContrato })
  @Prop({ required: true, enum: Object.values(StatusContrato), default: StatusContrato.Ativo })
  status: StatusContrato;

  @ApiProperty({ enum: PeriodicidadeContrato })
  @Prop({ required: true, enum: Object.values(PeriodicidadeContrato), default: PeriodicidadeContrato.Mensal })
  periodicidade: PeriodicidadeContrato;

  @ApiProperty({ description: 'Dia do vencimento (1-28)' })
  @Prop({ required: true, min: 1, max: 28 })
  diaVencimento: number;

  @ApiProperty({ type: [String] })
  @Prop({ type: [String], default: [] })
  servicosIncluidos: string[];

  @ApiPropertyOptional()
  @Prop()
  observacoes: string;

  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
  deletedAt?: Date | null;
}

export const ContratoSchema = SchemaFactory.createForClass(Contrato);
ContratoSchema.plugin(auditTrailPlugin);
ContratoSchema.plugin(softDeletePlugin);
ContratoSchema.index({ tenantId: 1, companyId: 1 });
