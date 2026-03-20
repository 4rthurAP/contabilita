import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { auditTrailPlugin, softDeletePlugin } from '../../../database/mongoose-plugins';

export type CostCenterDocument = HydratedDocument<CostCenter>;

@Schema({ timestamps: true, collection: 'cost_centers' })
export class CostCenter {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ example: 'CC001' })
  @Prop({ required: true })
  codigo: string;

  @ApiProperty({ example: 'Departamento Financeiro' })
  @Prop({ required: true, trim: true })
  nome: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CostCenter', default: null })
  parentId: MongooseSchema.Types.ObjectId | null;

  @Prop({ default: true })
  isActive: boolean;

  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
  deletedAt?: Date | null;
}

export const CostCenterSchema = SchemaFactory.createForClass(CostCenter);

CostCenterSchema.plugin(auditTrailPlugin);
CostCenterSchema.plugin(softDeletePlugin);

CostCenterSchema.index({ tenantId: 1, companyId: 1, codigo: 1 }, { unique: true });
