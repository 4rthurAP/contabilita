import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { TipoNotaFiscal, StatusNotaFiscal, TipoImposto } from '@contabilita/shared';
import { auditTrailPlugin, softDeletePlugin } from '../../../database/mongoose-plugins';

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ _id: false })
export class InvoiceItemTax {
  @Prop({ required: true, enum: Object.values(TipoImposto) })
  tipo: TipoImposto;

  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  baseCalculo: Types.Decimal128;

  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  aliquota: Types.Decimal128;

  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  valor: Types.Decimal128;
}

export const InvoiceItemTaxSchema = SchemaFactory.createForClass(InvoiceItemTax);

@Schema({ _id: false })
export class InvoiceItem {
  @Prop({ required: true })
  descricao: string;

  @Prop({ required: true })
  ncm: string;

  @Prop({ required: true })
  cfop: string;

  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  quantidade: Types.Decimal128;

  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  valorUnitario: Types.Decimal128;

  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  valorTotal: Types.Decimal128;

  @Prop({ type: [InvoiceItemTaxSchema], default: [] })
  impostos: InvoiceItemTax[];
}

export const InvoiceItemSchema = SchemaFactory.createForClass(InvoiceItem);

@Schema({ timestamps: true, collection: 'invoices' })
export class Invoice {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ enum: TipoNotaFiscal })
  @Prop({ required: true, enum: Object.values(TipoNotaFiscal) })
  tipo: TipoNotaFiscal;

  @ApiProperty()
  @Prop({ required: true })
  numero: string;

  @ApiProperty()
  @Prop({ required: true, default: '1' })
  serie: string;

  @ApiProperty()
  @Prop({ required: true, type: Date })
  dataEmissao: Date;

  @ApiProperty({ enum: StatusNotaFiscal })
  @Prop({ required: true, enum: Object.values(StatusNotaFiscal), default: StatusNotaFiscal.Rascunho })
  status: StatusNotaFiscal;

  @Prop()
  fornecedorClienteNome: string;

  @Prop()
  fornecedorClienteCnpj: string;

  @Prop({ type: [InvoiceItemSchema], required: true })
  items: InvoiceItem[];

  // Totais calculados
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  totalProdutos: Types.Decimal128;

  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  totalNota: Types.Decimal128;

  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  totalIcms: Types.Decimal128;

  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  totalPis: Types.Decimal128;

  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  totalCofins: Types.Decimal128;

  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  totalIpi: Types.Decimal128;

  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  totalIss: Types.Decimal128;

  // XML original da NF-e (se importada)
  @Prop()
  xmlOriginal: string;

  @Prop()
  chaveAcesso: string;

  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
  deletedAt?: Date | null;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

InvoiceSchema.plugin(auditTrailPlugin);
InvoiceSchema.plugin(softDeletePlugin);

InvoiceSchema.index({ tenantId: 1, companyId: 1, dataEmissao: -1 });
InvoiceSchema.index({ tenantId: 1, companyId: 1, numero: 1, serie: 1 });
InvoiceSchema.index({ chaveAcesso: 1 }, { sparse: true });
