import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { tenantScopedPlugin } from '../../../database/mongoose-plugins/tenant-scoped.plugin';
import { auditTrailPlugin } from '../../../database/mongoose-plugins/audit-trail.plugin';
import { softDeletePlugin } from '../../../database/mongoose-plugins/soft-delete.plugin';

export type CertificateDocument = HydratedDocument<Certificate>;

export enum CertificateType {
  A1 = 'A1',
  A3 = 'A3',
}

export enum CertificateStatus {
  Valido = 'valido',
  Expirando = 'expirando',
  Expirado = 'expirado',
  Revogado = 'revogado',
}

@Schema({ timestamps: true, collection: 'certificates' })
export class Certificate {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ enum: CertificateType })
  @Prop({ required: true, enum: CertificateType })
  tipo: CertificateType;

  @ApiProperty({ description: 'Nome amigavel do certificado' })
  @Prop({ required: true })
  nome: string;

  @ApiProperty({ description: 'Razao social do titular' })
  @Prop({ required: true })
  titular: string;

  @ApiProperty({ description: 'CNPJ/CPF do titular' })
  @Prop({ required: true, index: true })
  documento: string;

  @ApiProperty({ description: 'Numero serial do certificado' })
  @Prop({ required: true })
  serialNumber: string;

  @ApiProperty({ description: 'Autoridade certificadora emissora' })
  @Prop({ required: true })
  issuer: string;

  @ApiProperty()
  @Prop({ type: Date, required: true })
  validFrom: Date;

  @ApiProperty()
  @Prop({ type: Date, required: true, index: true })
  validTo: Date;

  @ApiProperty({ enum: CertificateStatus })
  @Prop({ required: true, enum: CertificateStatus, default: CertificateStatus.Valido })
  status: CertificateStatus;

  /** Conteudo do PFX criptografado com AES-256-GCM */
  @Prop({ required: true, select: false })
  encryptedPfx: string;

  /** IV para AES-256-GCM */
  @Prop({ required: true, select: false })
  encryptionIv: string;

  /** Auth tag para AES-256-GCM */
  @Prop({ required: true, select: false })
  encryptionTag: string;

  /** Senha do PFX criptografada com AES-256-GCM */
  @Prop({ required: true, select: false })
  encryptedPassword: string;

  @Prop({ required: true, select: false })
  passwordIv: string;

  @Prop({ required: true, select: false })
  passwordTag: string;

  /** Fingerprint SHA-256 do certificado (para identificacao rapida) */
  @Prop({ required: true })
  fingerprint: string;
}

export const CertificateSchema = SchemaFactory.createForClass(Certificate);
CertificateSchema.plugin(tenantScopedPlugin);
CertificateSchema.plugin(auditTrailPlugin);
CertificateSchema.plugin(softDeletePlugin);
CertificateSchema.index({ tenantId: 1, companyId: 1, status: 1 });
CertificateSchema.index({ validTo: 1, status: 1 });
