import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoConta, NaturezaConta } from '@contabilita/shared';
import { auditTrailPlugin, softDeletePlugin } from '../../../database/mongoose-plugins';

export type AccountDocument = HydratedDocument<Account>;

/**
 * Plano de Contas hierarquico.
 * Contas sinteticas (isAnalytical=false) agrupam contas analiticas.
 * Apenas contas analiticas recebem lancamentos.
 */
@Schema({ timestamps: true, collection: 'accounts' })
export class Account {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ example: '1.1.01.001', description: 'Codigo hierarquico da conta' })
  @Prop({ required: true })
  codigo: string;

  @ApiProperty({ example: 'Caixa Geral' })
  @Prop({ required: true, trim: true })
  nome: string;

  @ApiProperty({ enum: TipoConta })
  @Prop({ required: true, enum: Object.values(TipoConta) })
  tipo: TipoConta;

  @ApiProperty({ enum: NaturezaConta })
  @Prop({ required: true, enum: Object.values(NaturezaConta) })
  natureza: NaturezaConta;

  @ApiProperty({ example: 4, description: 'Nivel na hierarquia (1=grupo, 2=subgrupo, ...)' })
  @Prop({ required: true })
  nivel: number;

  @ApiPropertyOptional({ description: 'ID da conta pai (null para contas raiz)' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account', default: null })
  parentId: MongooseSchema.Types.ObjectId | null;

  @ApiProperty({ description: 'true = recebe lancamentos, false = conta sintetica (agrupadora)' })
  @Prop({ required: true, default: false })
  isAnalytical: boolean;

  @ApiPropertyOptional({ description: 'Codigo referencial RFB para SPED' })
  @Prop()
  codigoReferencialRfb: string;

  @ApiProperty()
  @Prop({ default: true })
  isActive: boolean;

  // Plugin fields
  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
  deletedAt?: Date | null;
}

export const AccountSchema = SchemaFactory.createForClass(Account);

AccountSchema.plugin(auditTrailPlugin);
AccountSchema.plugin(softDeletePlugin);

AccountSchema.index({ tenantId: 1, companyId: 1, codigo: 1 }, { unique: true });
AccountSchema.index({ tenantId: 1, companyId: 1, parentId: 1 });
