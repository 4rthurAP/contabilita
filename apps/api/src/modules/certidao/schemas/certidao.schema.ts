import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { auditTrailPlugin } from '../../../database/mongoose-plugins';

export type CertidaoDocument = HydratedDocument<Certidao>;

export enum CertidaoTipo {
  CndFederal = 'cnd_federal',
  CrfFgts = 'crf_fgts',
  Cndt = 'cndt',
  CndEstadual = 'cnd_estadual',
  CndMunicipal = 'cnd_municipal',
}

export enum CertidaoStatus {
  Valida = 'valida',
  Expirando = 'expirando',
  Expirada = 'expirada',
  NaoEmitida = 'nao_emitida',
  Positiva = 'positiva', // Dividas pendentes
}

@Schema({ timestamps: true, collection: 'certidoes' })
export class Certidao {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ enum: CertidaoTipo })
  @Prop({ required: true, enum: CertidaoTipo })
  tipo: CertidaoTipo;

  @ApiProperty({ enum: CertidaoStatus })
  @Prop({ required: true, enum: CertidaoStatus, default: CertidaoStatus.NaoEmitida })
  status: CertidaoStatus;

  @Prop({ type: Date })
  dataEmissao?: Date;

  @Prop({ type: Date })
  dataValidade?: Date;

  @Prop()
  codigoControle?: string;

  /** Chave do PDF no StorageService */
  @Prop()
  pdfStorageKey?: string;

  @Prop()
  observacao?: string;

  createdBy?: MongooseSchema.Types.ObjectId;
}

export const CertidaoSchema = SchemaFactory.createForClass(Certidao);
CertidaoSchema.plugin(auditTrailPlugin);
CertidaoSchema.index({ tenantId: 1, companyId: 1, tipo: 1 });
CertidaoSchema.index({ tenantId: 1, dataValidade: 1 });
