import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { TipoImposto, StatusGuia } from '@contabilita/shared';

export type TaxPaymentDocument = HydratedDocument<TaxPayment>;

/**
 * Guia de pagamento de imposto (DARF, DAS, guia ISS).
 */
@Schema({ timestamps: true, collection: 'tax_payments' })
export class TaxPayment {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'TaxAssessment' })
  assessmentId: Types.ObjectId;

  @ApiProperty({ enum: TipoImposto })
  @Prop({ required: true, enum: Object.values(TipoImposto) })
  tipo: TipoImposto;

  @ApiProperty({ description: 'Tipo da guia: DARF, DAS, ISS, GPS' })
  @Prop({ required: true })
  tipoGuia: string;

  @ApiProperty()
  @Prop({ required: true })
  competencia: string; // MM/YYYY

  @ApiProperty()
  @Prop({ required: true, type: Date })
  dataVencimento: Date;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  valorPrincipal: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  valorMulta: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  valorJuros: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  valorTotal: Types.Decimal128;

  @ApiProperty({ description: 'Codigo da receita (ex: 1708 para DARF IRRF)' })
  @Prop()
  codigoReceita: string;

  @ApiProperty({ enum: StatusGuia })
  @Prop({ required: true, enum: Object.values(StatusGuia), default: StatusGuia.Pendente })
  status: StatusGuia;

  @Prop({ type: Date })
  dataPagamento: Date;

  @Prop()
  codigoBarras: string;
}

export const TaxPaymentSchema = SchemaFactory.createForClass(TaxPayment);

TaxPaymentSchema.index({ tenantId: 1, companyId: 1, dataVencimento: -1 });
TaxPaymentSchema.index({ tenantId: 1, companyId: 1, status: 1 });
