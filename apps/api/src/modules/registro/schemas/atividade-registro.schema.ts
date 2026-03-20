import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { auditTrailPlugin, softDeletePlugin } from '../../../database/mongoose-plugins';

export type AtividadeRegistroDocument = HydratedDocument<AtividadeRegistro>;

@Schema({ timestamps: true, collection: 'atividades_registro' })
export class AtividadeRegistro {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'Registro', index: true })
  registroId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  descricao: string;

  @Prop()
  responsavel?: string;

  @Prop({ type: Date })
  prazo?: Date;

  @Prop({ default: false })
  concluida: boolean;

  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
  deletedAt?: Date | null;
}

export const AtividadeRegistroSchema = SchemaFactory.createForClass(AtividadeRegistro);

AtividadeRegistroSchema.plugin(auditTrailPlugin);
AtividadeRegistroSchema.plugin(softDeletePlugin);

AtividadeRegistroSchema.index({ tenantId: 1, registroId: 1 });
