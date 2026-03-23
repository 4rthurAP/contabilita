import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { auditTrailPlugin } from '../../../database/mongoose-plugins';

export type AuditFindingDocument = HydratedDocument<AuditFinding>;

export enum AuditSeverity {
  Info = 'info',
  Warning = 'warning',
  Critical = 'critical',
}

export enum AuditFindingStatus {
  Open = 'open',
  Acknowledged = 'acknowledged',
  Resolved = 'resolved',
  FalsePositive = 'false_positive',
}

@Schema({ timestamps: true, collection: 'audit_findings' })
export class AuditFinding {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  checkType: string; // 'duplicate_invoice', 'missing_journal', 'unbalanced', 'number_gap', 'benford'

  @ApiProperty({ enum: AuditSeverity })
  @Prop({ required: true, enum: AuditSeverity })
  severity: AuditSeverity;

  @ApiProperty()
  @Prop({ required: true })
  title: string;

  @ApiProperty()
  @Prop({ required: true })
  description: string;

  @ApiProperty({ enum: AuditFindingStatus })
  @Prop({ required: true, enum: AuditFindingStatus, default: AuditFindingStatus.Open })
  status: AuditFindingStatus;

  /** Referencia ao documento que gerou o achado */
  @Prop({ type: MongooseSchema.Types.Mixed })
  reference?: {
    collection: string;
    documentId: string;
    field?: string;
  };

  @Prop()
  resolution?: string;

  @Prop({ type: Date })
  resolvedAt?: Date;

  createdBy?: MongooseSchema.Types.ObjectId;
}

export const AuditFindingSchema = SchemaFactory.createForClass(AuditFinding);
AuditFindingSchema.plugin(auditTrailPlugin);
AuditFindingSchema.index({ tenantId: 1, companyId: 1, status: 1 });
AuditFindingSchema.index({ tenantId: 1, companyId: 1, checkType: 1 });
