import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { auditTrailPlugin } from '../../../database/mongoose-plugins';

export type DocumentDocument = HydratedDocument<UploadedDocument>;

export enum DocumentStatus {
  Uploaded = 'uploaded',
  Processing = 'processing',
  Processed = 'processed',
  Error = 'error',
}

export enum DocumentType {
  NotaFiscal = 'nota_fiscal',
  Recibo = 'recibo',
  Boleto = 'boleto',
  Extrato = 'extrato',
  Contrato = 'contrato',
  Outros = 'outros',
}

@Schema({ timestamps: true, collection: 'uploaded_documents' })
export class UploadedDocument {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  originalFileName: string;

  @Prop({ required: true })
  storageKey: string;

  @Prop()
  contentType: string;

  @Prop()
  fileSize: number;

  @ApiProperty({ enum: DocumentStatus })
  @Prop({ required: true, enum: DocumentStatus, default: DocumentStatus.Uploaded })
  status: DocumentStatus;

  @ApiProperty({ enum: DocumentType })
  @Prop({ enum: DocumentType })
  documentType?: DocumentType;

  /** Dados extraidos pelo OCR */
  @Prop({ type: MongooseSchema.Types.Mixed })
  extractedData?: {
    cnpj?: string;
    razaoSocial?: string;
    dataEmissao?: string;
    numero?: string;
    valorTotal?: string;
    items?: Array<{
      descricao: string;
      quantidade?: string;
      valorUnitario?: string;
      valorTotal?: string;
      ncm?: string;
      cfop?: string;
    }>;
    impostos?: {
      icms?: string;
      pis?: string;
      cofins?: string;
      ipi?: string;
      iss?: string;
    };
  };

  /** Confianca da extracao (0-1) */
  @Prop({ type: Number })
  confidence?: number;

  /** ID da nota fiscal criada a partir deste documento */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Invoice' })
  invoiceId?: MongooseSchema.Types.ObjectId;

  @Prop()
  errorMessage?: string;

  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
}

export const UploadedDocumentSchema = SchemaFactory.createForClass(UploadedDocument);
UploadedDocumentSchema.plugin(auditTrailPlugin);
UploadedDocumentSchema.index({ tenantId: 1, companyId: 1, status: 1 });
