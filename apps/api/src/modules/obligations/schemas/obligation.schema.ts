import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { auditTrailPlugin } from '../../../database/mongoose-plugins';

export type ObligationDocument = HydratedDocument<Obligation>;

/**
 * Obrigacao acessoria — rastreia status de entrega
 * de cada obrigacao fiscal por empresa/periodo.
 */
@Schema({ timestamps: true, collection: 'obligations' })
export class Obligation {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Tipo: ECD, EFD, EFD_REINF, DCTFWEB, DMED, DIMOB, DIRF, DEFIS, DIRBI, FGTS_DIGITAL' })
  @Prop({ required: true })
  tipo: string;

  @ApiProperty()
  @Prop({ required: true })
  competencia: string; // MM/YYYY ou YYYY

  @ApiProperty()
  @Prop({ required: true, type: Date })
  prazoEntrega: Date;

  @ApiProperty({ enum: ['pendente', 'gerada', 'validada', 'transmitida', 'retificada'] })
  @Prop({ required: true, default: 'pendente' })
  status: string;

  @Prop()
  fileName: string;

  @Prop()
  fileContent: string; // Legacy: conteudo inline (migrar para S3)

  @Prop()
  fileKey: string; // Storage key para S3/local

  @Prop()
  recibo: string; // Numero do recibo de transmissao

  @Prop({ type: Date })
  dataTransmissao: Date;

  @Prop()
  observacoes: string;

  /** Log de transmissoes (tentativas, erros, recibos) */
  @Prop({
    type: [{
      date: { type: Date, required: true },
      action: { type: String, required: true },
      status: { type: String, required: true },
      recibo: { type: String },
      details: { type: String },
    }],
    default: [],
  })
  transmissionLog: Array<{
    date: Date;
    action: string;
    status: string;
    recibo?: string;
    details?: string;
  }>;

  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
}

export const ObligationSchema = SchemaFactory.createForClass(Obligation);
ObligationSchema.plugin(auditTrailPlugin);
ObligationSchema.index({ tenantId: 1, companyId: 1, tipo: 1, competencia: 1 }, { unique: true });
ObligationSchema.index({ tenantId: 1, companyId: 1, prazoEntrega: 1 });
