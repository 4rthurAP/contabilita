import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { auditTrailPlugin } from '../../../database/mongoose-plugins';

export type ReportTemplateDocument = HydratedDocument<ReportTemplate>;

export enum ReportCategory {
  Contabil = 'contabil',    // Balanco, DRE, DMPL, DVA
  Fiscal = 'fiscal',        // Livros fiscais, apuracoes
  Trabalhista = 'trabalhista', // Folha, ferias, rescisoes
  Gerencial = 'gerencial',  // KPIs, dashboards
  Custom = 'custom',        // Definido pelo usuario
}

@Schema({ timestamps: true, collection: 'report_templates' })
export class ReportTemplate {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @ApiProperty({ enum: ReportCategory })
  @Prop({ required: true, enum: ReportCategory })
  category: ReportCategory;

  /** Layout do relatorio (JSON para renderizacao) */
  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  layout: {
    pageSize: 'A4' | 'letter';
    orientation: 'portrait' | 'landscape';
    margins: { top: number; bottom: number; left: number; right: number };
    header?: { text: string; showLogo: boolean };
    footer?: { text: string; showPageNumber: boolean };
    sections: Array<{
      type: 'title' | 'text' | 'table' | 'chart' | 'spacer';
      config: Record<string, any>;
    }>;
  };

  /** Query de dados (MongoDB aggregation pipeline em JSON) */
  @Prop({ type: MongooseSchema.Types.Mixed })
  dataQuery?: {
    collection: string;
    pipeline: any[];
    parameters?: Array<{ name: string; type: string; default?: any }>;
  };

  /** Template pre-built (nao editavel pelo usuario) */
  @Prop({ default: false })
  isBuiltIn: boolean;

  @Prop({ default: true })
  isActive: boolean;

  createdBy?: MongooseSchema.Types.ObjectId;
}

export const ReportTemplateSchema = SchemaFactory.createForClass(ReportTemplate);
ReportTemplateSchema.plugin(auditTrailPlugin);
ReportTemplateSchema.index({ tenantId: 1, category: 1 });
