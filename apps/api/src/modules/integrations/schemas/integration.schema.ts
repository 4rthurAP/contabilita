import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { auditTrailPlugin } from '../../../database/mongoose-plugins';

export type IntegrationDocument = HydratedDocument<Integration>;

export enum IntegrationProvider {
  // Open Banking
  Pluggy = 'pluggy',
  Belvo = 'belvo',
  // Payment Gateways
  Asaas = 'asaas',
  PagHiper = 'paghiper',
  // ERP
  Bling = 'bling',
  Totvs = 'totvs',
  // Custom webhook
  Webhook = 'webhook',
}

export enum IntegrationStatus {
  Active = 'active',
  Inactive = 'inactive',
  Error = 'error',
  Pending = 'pending',
}

@Schema({ timestamps: true, collection: 'integrations' })
export class Integration {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, index: true })
  companyId?: MongooseSchema.Types.ObjectId;

  @ApiProperty({ enum: IntegrationProvider })
  @Prop({ required: true, enum: IntegrationProvider })
  provider: IntegrationProvider;

  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiProperty({ enum: IntegrationStatus })
  @Prop({ required: true, enum: IntegrationStatus, default: IntegrationStatus.Pending })
  status: IntegrationStatus;

  /** Credenciais criptografadas (API key, OAuth tokens) */
  @Prop({ type: MongooseSchema.Types.Mixed, select: false })
  credentials?: Record<string, string>;

  /** Mapeamento de campos (de/para entre sistemas) */
  @Prop({ type: MongooseSchema.Types.Mixed })
  fieldMapping?: Record<string, string>;

  /** URL do webhook de saida (para integracoes webhook) */
  @Prop()
  webhookUrl?: string;

  /** Eventos que disparam o webhook */
  @Prop({ type: [String], default: [] })
  subscribedEvents: string[];

  /** Ultima sincronizacao bem-sucedida */
  @Prop({ type: Date })
  lastSyncAt?: Date;

  @Prop()
  errorMessage?: string;

  createdBy?: MongooseSchema.Types.ObjectId;
}

export const IntegrationSchema = SchemaFactory.createForClass(Integration);
IntegrationSchema.plugin(auditTrailPlugin);
IntegrationSchema.index({ tenantId: 1, provider: 1 });
