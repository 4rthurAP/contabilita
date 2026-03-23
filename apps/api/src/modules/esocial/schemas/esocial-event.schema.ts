import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { auditTrailPlugin } from '../../../database/mongoose-plugins';

export type EsocialEventDocument = HydratedDocument<EsocialEvent>;

export enum EsocialEventStatus {
  Pendente = 'pendente',
  Gerado = 'gerado',
  Assinado = 'assinado',
  Enviado = 'enviado',
  Processado = 'processado',
  Rejeitado = 'rejeitado',
  Erro = 'erro',
}

export enum EsocialEventType {
  S1000 = 'S-1000', // Informacoes do empregador
  S1200 = 'S-1200', // Remuneracao do trabalhador
  S1210 = 'S-1210', // Pagamentos de rendimentos
  S2200 = 'S-2200', // Cadastramento inicial / admissao
  S2206 = 'S-2206', // Alteracao de contrato
  S2299 = 'S-2299', // Desligamento
  S2300 = 'S-2300', // Trabalhador sem vinculo (TSV)
  S3000 = 'S-3000', // Exclusao de eventos
}

@Schema({ timestamps: true, collection: 'esocial_events' })
export class EsocialEvent {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ enum: EsocialEventType })
  @Prop({ required: true, enum: Object.values(EsocialEventType) })
  tipo: EsocialEventType;

  @ApiProperty()
  @Prop({ required: true })
  competencia: string; // MM/YYYY

  @ApiProperty({ enum: EsocialEventStatus })
  @Prop({ required: true, enum: EsocialEventStatus, default: EsocialEventStatus.Pendente })
  status: EsocialEventStatus;

  /** XML do evento gerado */
  @Prop()
  xmlContent?: string;

  /** XML assinado (com certificado A1) */
  @Prop()
  xmlSigned?: string;

  /** ID do evento no eSocial */
  @Prop()
  eventId?: string;

  /** Protocolo de envio (retornado pelo eSocial) */
  @Prop()
  protocolo?: string;

  /** Recibo de processamento */
  @Prop()
  recibo?: string;

  /** Referencia ao funcionario (para eventos de trabalhador) */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Employee' })
  employeeId?: MongooseSchema.Types.ObjectId;

  /** Referencia a folha (para S-1200/S-1210) */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PayrollRun' })
  payrollRunId?: MongooseSchema.Types.ObjectId;

  @Prop()
  errorMessage?: string;

  @Prop({ type: Date })
  sentAt?: Date;

  @Prop({ type: Date })
  processedAt?: Date;

  createdBy?: MongooseSchema.Types.ObjectId;
}

export const EsocialEventSchema = SchemaFactory.createForClass(EsocialEvent);
EsocialEventSchema.plugin(auditTrailPlugin);
EsocialEventSchema.index({ tenantId: 1, companyId: 1, tipo: 1, competencia: 1 });
EsocialEventSchema.index({ tenantId: 1, status: 1 });
