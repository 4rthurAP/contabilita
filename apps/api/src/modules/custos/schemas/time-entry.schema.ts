import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { CategoriaAtividade } from '@contabilita/shared';
import { auditTrailPlugin, softDeletePlugin } from '../../../database/mongoose-plugins';

export type TimeEntryDocument = HydratedDocument<TimeEntry>;

@Schema({ timestamps: true, collection: 'time_entries' })
export class TimeEntry {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true, type: Date })
  data: Date;

  @ApiProperty({ description: 'Duracao em minutos' })
  @Prop({ required: true })
  duracao: number;

  @ApiProperty()
  @Prop({ trim: true })
  descricao: string;

  @ApiProperty({ enum: CategoriaAtividade })
  @Prop({ required: true, enum: Object.values(CategoriaAtividade) })
  categoria: CategoriaAtividade;

  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
  deletedAt?: Date | null;
}

export const TimeEntrySchema = SchemaFactory.createForClass(TimeEntry);

TimeEntrySchema.plugin(auditTrailPlugin);
TimeEntrySchema.plugin(softDeletePlugin);

TimeEntrySchema.index({ tenantId: 1, companyId: 1, data: -1 });
TimeEntrySchema.index({ tenantId: 1, userId: 1, data: -1 });
