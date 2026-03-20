import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { TipoProtocolo, StatusProtocolo } from '@contabilita/shared';
import { auditTrailPlugin, softDeletePlugin } from '../../../database/mongoose-plugins';

export type ProtocoloDocument = HydratedDocument<Protocolo>;

@Schema({ timestamps: true, collection: 'protocolos' })
export class Protocolo {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true, unique: true })
  numero: string;

  @ApiProperty({ enum: TipoProtocolo })
  @Prop({ required: true, enum: Object.values(TipoProtocolo) })
  tipo: TipoProtocolo;

  @ApiProperty()
  @Prop({ required: true, type: Date, default: Date.now })
  dataRegistro: Date;

  @ApiProperty()
  @Prop({ required: true, trim: true })
  descricao: string;

  @ApiProperty()
  @Prop({ trim: true })
  remetente: string;

  @ApiProperty()
  @Prop({ trim: true })
  destinatario: string;

  @ApiProperty({ enum: StatusProtocolo })
  @Prop({
    required: true,
    enum: Object.values(StatusProtocolo),
    default: StatusProtocolo.Registrado,
  })
  status: StatusProtocolo;

  @ApiProperty()
  @Prop()
  observacoes: string;

  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
  deletedAt?: Date | null;
}

export const ProtocoloSchema = SchemaFactory.createForClass(Protocolo);

ProtocoloSchema.plugin(auditTrailPlugin);
ProtocoloSchema.plugin(softDeletePlugin);

ProtocoloSchema.index({ tenantId: 1, companyId: 1, numero: 1 }, { unique: true });
ProtocoloSchema.index({ tenantId: 1, companyId: 1, status: 1 });
ProtocoloSchema.index({ tenantId: 1, companyId: 1, tipo: 1 });
