import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { TipoRegistro, StatusRegistro } from '@contabilita/shared';
import { auditTrailPlugin, softDeletePlugin } from '../../../database/mongoose-plugins';

export type RegistroDocument = HydratedDocument<Registro>;

@Schema({ timestamps: true, collection: 'registros' })
export class Registro {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: Object.values(TipoRegistro) })
  tipo: TipoRegistro;

  @Prop({ required: true, enum: Object.values(StatusRegistro), default: StatusRegistro.Rascunho })
  status: StatusRegistro;

  @Prop({ type: Date })
  dataProtocolo?: Date;

  @Prop()
  nire?: string;

  @Prop()
  observacoes?: string;

  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
  deletedAt?: Date | null;
}

export const RegistroSchema = SchemaFactory.createForClass(Registro);

RegistroSchema.plugin(auditTrailPlugin);
RegistroSchema.plugin(softDeletePlugin);

RegistroSchema.index({ tenantId: 1, companyId: 1, tipo: 1 });
RegistroSchema.index({ tenantId: 1, status: 1 });
