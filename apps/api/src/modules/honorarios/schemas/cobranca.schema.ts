import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusCobranca, FormaPagamento } from '@contabilita/shared';
import { auditTrailPlugin, softDeletePlugin } from '../../../database/mongoose-plugins';

export type CobrancaDocument = HydratedDocument<Cobranca>;

@Schema({ timestamps: true, collection: 'cobrancas' })
export class Cobranca {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'Contrato' })
  contratoId: Types.ObjectId;

  @ApiProperty({ description: 'Competencia no formato YYYY/MM' })
  @Prop({ required: true })
  competencia: string;

  @ApiProperty()
  @Prop({ required: true, type: Date })
  dataVencimento: Date;

  @ApiPropertyOptional()
  @Prop({ type: Date })
  dataPagamento: Date;

  @ApiProperty({ description: 'Valor principal da cobranca' })
  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  valorPrincipal: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  valorDesconto: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  valorJuros: Types.Decimal128;

  @ApiProperty({ description: 'Valor total (principal - desconto + juros)' })
  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  valorTotal: Types.Decimal128;

  @ApiProperty({ enum: StatusCobranca })
  @Prop({ required: true, enum: Object.values(StatusCobranca), default: StatusCobranca.Pendente })
  status: StatusCobranca;

  @ApiPropertyOptional({ enum: FormaPagamento })
  @Prop({ enum: Object.values(FormaPagamento) })
  formaPagamento: FormaPagamento;

  @ApiPropertyOptional()
  @Prop()
  nossoNumero: string;

  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
  deletedAt?: Date | null;
}

export const CobrancaSchema = SchemaFactory.createForClass(Cobranca);
CobrancaSchema.plugin(auditTrailPlugin);
CobrancaSchema.plugin(softDeletePlugin);
CobrancaSchema.index({ tenantId: 1, companyId: 1, competencia: 1 });
CobrancaSchema.index({ tenantId: 1, companyId: 1, contratoId: 1 });
