import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { auditTrailPlugin } from '../../../database/mongoose-plugins';

export type CompanyGroupDocument = HydratedDocument<CompanyGroup>;

@Schema({ _id: false })
export class EliminationRule {
  /** CNPJ origem (empresa do grupo que emite) */
  @Prop({ required: true }) cnpjOrigem: string;
  /** CNPJ destino (empresa do grupo que recebe) */
  @Prop({ required: true }) cnpjDestino: string;
  /** Conta contabil a eliminar */
  @Prop() contaContabil?: string;
  /** Descricao da regra */
  @Prop() descricao?: string;
}

const EliminationRuleSchema = SchemaFactory.createForClass(EliminationRule);

@Schema({ timestamps: true, collection: 'company_groups' })
export class CompanyGroup {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  /** IDs das empresas do grupo */
  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'Company', default: [] })
  companyIds: Types.ObjectId[];

  /** Empresa controladora (holding) */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company' })
  holdingCompanyId?: Types.ObjectId;

  /** Regras de eliminacao de transacoes intercompany */
  @Prop({ type: [EliminationRuleSchema], default: [] })
  eliminationRules: EliminationRule[];

  createdBy?: MongooseSchema.Types.ObjectId;
}

export const CompanyGroupSchema = SchemaFactory.createForClass(CompanyGroup);
CompanyGroupSchema.plugin(auditTrailPlugin);
CompanyGroupSchema.index({ tenantId: 1 });
