import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { auditTrailPlugin } from '../../../database/mongoose-plugins';

export type WidgetDefinitionDocument = HydratedDocument<WidgetDefinition>;

export enum WidgetType {
  LineChart = 'line_chart',
  BarChart = 'bar_chart',
  PieChart = 'pie_chart',
  Metric = 'metric',
  Table = 'table',
  Gauge = 'gauge',
  AreaChart = 'area_chart',
}

export enum WidgetDataSource {
  TaxBurden = 'tax_burden',
  DreTrend = 'dre_trend',
  ReceivablesAging = 'receivables_aging',
  PayrollCost = 'payroll_cost',
  ReconciliationRate = 'reconciliation_rate',
  ComplianceRate = 'compliance_rate',
  RevenueByCompany = 'revenue_by_company',
  CashFlowProjection = 'cash_flow_projection',
  Custom = 'custom',
}

@Schema({ timestamps: true, collection: 'widget_definitions' })
export class WidgetDefinition {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  title: string;

  @ApiProperty({ enum: WidgetType })
  @Prop({ required: true, enum: WidgetType })
  type: WidgetType;

  @ApiProperty({ enum: WidgetDataSource })
  @Prop({ required: true, enum: WidgetDataSource })
  dataSource: WidgetDataSource;

  /** Posicao no grid (react-grid-layout format) */
  @Prop({ type: MongooseSchema.Types.Mixed })
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };

  /** Configuracao especifica do widget */
  @Prop({ type: MongooseSchema.Types.Mixed })
  config?: {
    companyIds?: string[]; // Filtrar por empresas
    dateRange?: { start: string; end: string };
    groupBy?: string;
    colorScheme?: string;
  };

  /** ID do dashboard pai */
  @Prop({ type: MongooseSchema.Types.ObjectId })
  dashboardId?: MongooseSchema.Types.ObjectId;

  @Prop({ default: true })
  isVisible: boolean;

  createdBy?: MongooseSchema.Types.ObjectId;
}

export const WidgetDefinitionSchema = SchemaFactory.createForClass(WidgetDefinition);
WidgetDefinitionSchema.plugin(auditTrailPlugin);
WidgetDefinitionSchema.index({ tenantId: 1, dashboardId: 1 });
