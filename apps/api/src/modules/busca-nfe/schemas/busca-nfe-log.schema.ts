import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type BuscaNfeLogDocument = HydratedDocument<BuscaNfeLog>;

@Schema({ timestamps: true, collection: 'busca_nfe_logs' })
export class BuscaNfeLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, required: true, default: () => new Date() })
  dataConsulta: Date;

  @Prop({ default: 0 })
  quantidadeEncontrada: number;

  @Prop({ default: 0 })
  quantidadeImportada: number;

  @Prop({ type: [String], default: [] })
  erros: string[];

  @Prop()
  ultimoNSU?: string;
}

export const BuscaNfeLogSchema = SchemaFactory.createForClass(BuscaNfeLog);

BuscaNfeLogSchema.index({ tenantId: 1, companyId: 1, dataConsulta: -1 });
