import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { tenantScopedPlugin } from '../../../database/mongoose-plugins/tenant-scoped.plugin';
import { auditTrailPlugin } from '../../../database/mongoose-plugins/audit-trail.plugin';

export type GeneratedReportDocument = HydratedDocument<GeneratedReport>;

@Schema({ timestamps: true, collection: 'generated_reports' })
export class GeneratedReport {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Tipo do relatorio: dre, balanco, indicadores, dre-trend' })
  @Prop({ required: true })
  reportType: string;

  @ApiProperty({ description: 'Titulo legivel do relatorio' })
  @Prop({ required: true })
  title: string;

  @ApiProperty({ description: 'Parametros usados na geracao' })
  @Prop({ type: MongooseSchema.Types.Mixed })
  params: Record<string, any>;

  @ApiProperty({ description: 'Resultado serializado (JSON)' })
  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  data: Record<string, any>;

  @ApiProperty({ description: 'Status da geracao' })
  @Prop({ required: true, enum: ['pendente', 'concluido', 'erro'], default: 'pendente' })
  status: string;

  @Prop()
  errorMessage?: string;

  @ApiProperty({ description: 'ID do usuario que solicitou' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  requestedBy: MongooseSchema.Types.ObjectId;
}

export const GeneratedReportSchema = SchemaFactory.createForClass(GeneratedReport);
GeneratedReportSchema.plugin(tenantScopedPlugin);
GeneratedReportSchema.plugin(auditTrailPlugin);
GeneratedReportSchema.index({ tenantId: 1, companyId: 1, reportType: 1, createdAt: -1 });
