import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { PrioridadeTarefa, StatusTarefa, CategoriaTarefa } from '@contabilita/shared';
import { auditTrailPlugin, softDeletePlugin } from '../../../database/mongoose-plugins';

export type TarefaDocument = HydratedDocument<Tarefa>;

@Schema({ timestamps: true, collection: 'tarefas' })
export class Tarefa {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, index: true })
  companyId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  titulo: string;

  @Prop()
  descricao?: string;

  @Prop({ required: true, enum: Object.values(PrioridadeTarefa), default: PrioridadeTarefa.Media })
  prioridade: PrioridadeTarefa;

  @Prop({ required: true, enum: Object.values(StatusTarefa), default: StatusTarefa.Pendente })
  status: StatusTarefa;

  @Prop({ type: Date })
  prazo?: Date;

  @Prop({ type: Date })
  dataConclusao?: Date;

  @Prop({ required: true, enum: Object.values(CategoriaTarefa), default: CategoriaTarefa.Outros })
  categoria: CategoriaTarefa;

  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
  deletedAt?: Date | null;
}

export const TarefaSchema = SchemaFactory.createForClass(Tarefa);

TarefaSchema.plugin(auditTrailPlugin);
TarefaSchema.plugin(softDeletePlugin);

TarefaSchema.index({ tenantId: 1, userId: 1, status: 1 });
TarefaSchema.index({ tenantId: 1, prazo: 1 });
