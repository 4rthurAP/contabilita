import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { auditTrailPlugin } from '../../../database/mongoose-plugins';

export type LalurEntryDocument = HydratedDocument<LalurEntry>;

/**
 * LALUR Parte A - Registro de adicoes e exclusoes ao lucro contabil
 * para apuracao do Lucro Real (base do IRPJ e CSLL).
 */
@Schema({ timestamps: true, collection: 'lalur_entries' })
export class LalurEntry {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  year: number;

  @ApiProperty({ description: 'Trimestre (1-4) ou 0 para anual' })
  @Prop({ required: true })
  quarter: number;

  @ApiProperty({ enum: ['adicao', 'exclusao'] })
  @Prop({ required: true, enum: ['adicao', 'exclusao'] })
  tipo: string;

  @ApiProperty()
  @Prop({ required: true })
  descricao: string;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  valor: Types.Decimal128;

  @ApiProperty({ description: 'Codigo da conta referencial RFB' })
  @Prop()
  codigoContaRfb: string;

  @ApiProperty({ description: 'Vinculo com Parte B (controle de saldo)' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'LalurBalance' })
  balanceId: Types.ObjectId;

  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
}

export const LalurEntrySchema = SchemaFactory.createForClass(LalurEntry);
LalurEntrySchema.plugin(auditTrailPlugin);
LalurEntrySchema.index({ tenantId: 1, companyId: 1, year: 1, quarter: 1 });
