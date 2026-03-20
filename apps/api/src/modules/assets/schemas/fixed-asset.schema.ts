import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { StatusBem, MetodoDepreciacao } from '@contabilita/shared';
import { auditTrailPlugin, softDeletePlugin } from '../../../database/mongoose-plugins';

export type FixedAssetDocument = HydratedDocument<FixedAsset>;

@Schema({ _id: false })
export class AssetMovement {
  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ required: true, enum: ['aquisicao', 'depreciacao', 'reavaliacao', 'baixa', 'transferencia'] })
  tipo: string;

  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  valor: Types.Decimal128;

  @Prop()
  descricao: string;
}

export const AssetMovementSchema = SchemaFactory.createForClass(AssetMovement);

@Schema({ timestamps: true, collection: 'fixed_assets' })
export class FixedAsset {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  codigo: string;

  @ApiProperty()
  @Prop({ required: true })
  descricao: string;

  @ApiProperty()
  @Prop({ required: true })
  grupo: string; // Imoveis, Veiculos, Maquinas, Moveis, etc.

  @ApiProperty()
  @Prop({ required: true, type: Date })
  dataAquisicao: Date;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  valorAquisicao: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  valorResidual: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  depreciacaoAcumulada: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  valorAtual: Types.Decimal128;

  @ApiProperty({ description: 'Taxa anual de depreciacao (ex: 0.10 = 10%)' })
  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  taxaDepreciacao: Types.Decimal128;

  @ApiProperty()
  @Prop({ required: true })
  vidaUtilMeses: number;

  @ApiProperty({ enum: MetodoDepreciacao })
  @Prop({ required: true, enum: Object.values(MetodoDepreciacao), default: MetodoDepreciacao.Linear })
  metodoDepreciacao: MetodoDepreciacao;

  @ApiProperty({ enum: StatusBem })
  @Prop({ required: true, enum: Object.values(StatusBem), default: StatusBem.Ativo })
  status: StatusBem;

  @ApiProperty()
  @Prop()
  notaFiscal: string;

  @ApiProperty()
  @Prop()
  fornecedor: string;

  @ApiProperty()
  @Prop()
  localizacao: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
  contaContabil: Types.ObjectId;

  // CIAP
  @ApiProperty({ description: 'Bem sujeito a CIAP (credito de ICMS/PIS/COFINS)' })
  @Prop({ default: false })
  ciap: boolean;

  @Prop({ default: 0 })
  ciapParcelasApropriadas: number;

  @Prop({ default: 48 })
  ciapTotalParcelas: number;

  @Prop({ type: [AssetMovementSchema], default: [] })
  movimentacoes: AssetMovement[];

  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
  deletedAt?: Date | null;
}

export const FixedAssetSchema = SchemaFactory.createForClass(FixedAsset);
FixedAssetSchema.plugin(auditTrailPlugin);
FixedAssetSchema.plugin(softDeletePlugin);
FixedAssetSchema.index({ tenantId: 1, companyId: 1, codigo: 1 }, { unique: true });
