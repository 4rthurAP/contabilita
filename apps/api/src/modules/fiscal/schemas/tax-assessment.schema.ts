import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { TipoImposto } from '@contabilita/shared';

export type TaxAssessmentDocument = HydratedDocument<TaxAssessment>;

/**
 * Apuracao mensal de um imposto especifico.
 * Consolidada a partir das notas fiscais do periodo.
 */
@Schema({ timestamps: true, collection: 'tax_assessments' })
export class TaxAssessment {
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

  @ApiProperty({ enum: TipoImposto })
  @Prop({ required: true, enum: Object.values(TipoImposto) })
  tipo: TipoImposto;

  @ApiProperty({ description: 'Base de calculo total do periodo' })
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  baseCalculo: Types.Decimal128;

  @ApiProperty({ description: 'Aliquota efetiva aplicada' })
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  aliquota: Types.Decimal128;

  @ApiProperty({ description: 'Valor apurado (debito)' })
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  valorApurado: Types.Decimal128;

  @ApiProperty({ description: 'Creditos do periodo (entradas)' })
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  creditos: Types.Decimal128;

  @ApiProperty({ description: 'Valor a recolher (apurado - creditos)' })
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  valorRecolher: Types.Decimal128;

  @ApiProperty()
  @Prop({ default: false })
  isClosed: boolean;
}

export const TaxAssessmentSchema = SchemaFactory.createForClass(TaxAssessment);

TaxAssessmentSchema.index(
  { tenantId: 1, companyId: 1, year: 1, month: 1, tipo: 1 },
  { unique: true },
);
