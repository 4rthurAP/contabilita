import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop()
  userName: string;

  @ApiProperty({ enum: ['create', 'update', 'delete', 'login', 'logout', 'action'] })
  @Prop({ required: true })
  action: string;

  @ApiProperty({ description: 'Nome da collection afetada' })
  @Prop({ required: true })
  resource: string;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.ObjectId })
  resourceId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Descricao legivel da acao' })
  @Prop()
  description: string;

  @ApiProperty({ description: 'Estado anterior (para update/delete)' })
  @Prop({ type: MongooseSchema.Types.Mixed })
  before: Record<string, any>;

  @ApiProperty({ description: 'Estado posterior (para create/update)' })
  @Prop({ type: MongooseSchema.Types.Mixed })
  after: Record<string, any>;

  @ApiProperty({ description: 'Campos alterados' })
  @Prop({ type: [String] })
  changedFields: string[];

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
AuditLogSchema.index({ tenantId: 1, resource: 1, resourceId: 1 });
AuditLogSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
