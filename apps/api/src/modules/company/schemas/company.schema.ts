import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { RegimeTributario } from '@contabilita/shared';
import { tenantScopedPlugin, auditTrailPlugin, softDeletePlugin } from '../../../database/mongoose-plugins';

export type CompanyDocument = HydratedDocument<Company>;

@Schema({ timestamps: true, collection: 'companies' })
export class Company {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true, unique: true })
  cnpj: string;

  @ApiProperty()
  @Prop({ required: true, trim: true })
  razaoSocial: string;

  @ApiProperty()
  @Prop({ trim: true })
  nomeFantasia: string;

  @ApiProperty({ enum: RegimeTributario })
  @Prop({ required: true, enum: Object.values(RegimeTributario) })
  regimeTributario: RegimeTributario;

  @ApiProperty()
  @Prop()
  inscricaoEstadual: string;

  @ApiProperty()
  @Prop()
  inscricaoMunicipal: string;

  @ApiProperty()
  @Prop()
  codigoNaturezaJuridica: string;

  @Prop(
    raw({
      cep: { type: String },
      logradouro: { type: String },
      numero: { type: String },
      complemento: { type: String },
      bairro: { type: String },
      cidade: { type: String },
      uf: { type: String },
      codigoIbge: { type: String },
    }),
  )
  endereco: Record<string, any>;

  @ApiProperty()
  @Prop({ default: true })
  isActive: boolean;

  // Campos adicionados pelos plugins
  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
  deletedAt?: Date | null;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

CompanySchema.plugin(auditTrailPlugin);
CompanySchema.plugin(softDeletePlugin);

CompanySchema.index({ tenantId: 1, cnpj: 1 }, { unique: true });
