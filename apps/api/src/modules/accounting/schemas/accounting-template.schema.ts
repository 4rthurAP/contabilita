import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { tenantScopedPlugin } from '../../../database/mongoose-plugins/tenant-scoped.plugin';
import { auditTrailPlugin } from '../../../database/mongoose-plugins/audit-trail.plugin';

export type AccountingTemplateDocument = HydratedDocument<AccountingTemplate>;

/**
 * Template de lancamento contabil automatico.
 * Mapeia combinacoes de CFOP/tipo de imposto para contas debito/credito.
 * Usado pelo InvoicePostedListener para gerar lancamentos automaticamente.
 */
@Schema({ timestamps: true, collection: 'accounting_templates' })
export class AccountingTemplate {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'CFOP que ativa este template (ex: 5102, 1102). Vazio = qualquer.' })
  @Prop()
  cfop?: string;

  @ApiProperty({ description: 'Tipo de nota: entrada ou saida' })
  @Prop({ required: true })
  tipoNota: string;

  @ApiProperty({ description: 'Nome descritivo do template' })
  @Prop({ required: true })
  nome: string;

  @ApiProperty({ description: 'Conta de debito (ID)' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account', required: true })
  contaDebitoId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Conta de credito (ID)' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account', required: true })
  contaCreditoId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Template para o historico do lancamento. Variaveis: {numero}, {fornecedor}, {valor}' })
  @Prop({ default: 'NF {numero} - {fornecedor}' })
  historicoTemplate: string;

  @ApiProperty({ description: 'Se true, gera lancamentos adicionais para cada imposto da NF' })
  @Prop({ default: false })
  gerarLancamentosImpostos: boolean;

  /** Conta de debito para ICMS a recuperar (entradas) */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
  contaIcmsRecuperarId?: MongooseSchema.Types.ObjectId;

  /** Conta de debito para PIS a recuperar (entradas Lucro Real) */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
  contaPisRecuperarId?: MongooseSchema.Types.ObjectId;

  /** Conta de debito para COFINS a recuperar (entradas Lucro Real) */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
  contaCofinsRecuperarId?: MongooseSchema.Types.ObjectId;

  @ApiProperty({ default: true })
  @Prop({ default: true })
  isActive: boolean;

  /** Prioridade (templates com CFOP especifico tem prioridade sobre genericos) */
  @Prop({ default: 0 })
  prioridade: number;
}

export const AccountingTemplateSchema = SchemaFactory.createForClass(AccountingTemplate);
AccountingTemplateSchema.plugin(tenantScopedPlugin);
AccountingTemplateSchema.plugin(auditTrailPlugin);
AccountingTemplateSchema.index({ tenantId: 1, companyId: 1, tipoNota: 1, cfop: 1 });
