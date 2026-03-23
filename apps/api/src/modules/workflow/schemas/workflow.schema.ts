import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { auditTrailPlugin } from '../../../database/mongoose-plugins';

export type WorkflowDocument = HydratedDocument<Workflow>;

@Schema({ _id: false })
export class WorkflowCondition {
  /** Campo do evento a avaliar (ex: 'totalNota', 'cfops', 'tipo') */
  @Prop({ required: true }) field: string;
  /** Operador: eq, ne, gt, lt, gte, lte, contains, in */
  @Prop({ required: true }) operator: string;
  /** Valor de comparacao */
  @Prop({ type: MongooseSchema.Types.Mixed, required: true }) value: any;
}

@Schema({ _id: false })
export class WorkflowAction {
  /** Tipo da acao */
  @Prop({ required: true }) type: 'create_notification' | 'send_email' | 'create_task' | 'create_journal_entry' | 'update_status' | 'webhook';
  /** Configuracao especifica da acao */
  @Prop({ type: MongooseSchema.Types.Mixed, required: true }) config: Record<string, any>;
}

const WorkflowConditionSchema = SchemaFactory.createForClass(WorkflowCondition);
const WorkflowActionSchema = SchemaFactory.createForClass(WorkflowAction);

@Schema({ timestamps: true, collection: 'workflows' })
export class Workflow {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiProperty()
  @Prop()
  description?: string;

  /** Evento que dispara o workflow (ex: 'invoice.posted', 'payroll.run.completed') */
  @ApiProperty()
  @Prop({ required: true })
  trigger: string;

  /** Condicoes que devem ser verdadeiras para executar (AND logic) */
  @Prop({ type: [WorkflowConditionSchema], default: [] })
  conditions: WorkflowCondition[];

  /** Acoes a executar quando ativado */
  @Prop({ type: [WorkflowActionSchema], required: true })
  actions: WorkflowAction[];

  @Prop({ default: true })
  isActive: boolean;

  /** Contadores de execucao */
  @Prop({ default: 0 })
  executionCount: number;

  @Prop({ type: Date })
  lastExecutedAt?: Date;

  createdBy?: MongooseSchema.Types.ObjectId;
}

export const WorkflowSchema = SchemaFactory.createForClass(Workflow);
WorkflowSchema.plugin(auditTrailPlugin);
WorkflowSchema.index({ tenantId: 1, trigger: 1, isActive: 1 });
