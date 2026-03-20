import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { TipoCustoFixo } from '@contabilita/shared';
import { auditTrailPlugin, softDeletePlugin } from '../../../database/mongoose-plugins';

export type CustoFixoDocument = HydratedDocument<CustoFixo>;

@Schema({ timestamps: true, collection: 'custos_fixos' })
export class CustoFixo {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true, trim: true })
  descricao: string;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  valorMensal: Types.Decimal128;

  @ApiProperty({ enum: TipoCustoFixo })
  @Prop({ required: true, enum: Object.values(TipoCustoFixo) })
  tipo: TipoCustoFixo;

  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
  deletedAt?: Date | null;
}

export const CustoFixoSchema = SchemaFactory.createForClass(CustoFixo);

CustoFixoSchema.plugin(auditTrailPlugin);
CustoFixoSchema.plugin(softDeletePlugin);

CustoFixoSchema.index({ tenantId: 1, tipo: 1 });
