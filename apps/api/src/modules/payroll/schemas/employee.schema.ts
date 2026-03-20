import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { StatusFuncionario } from '@contabilita/shared';
import { auditTrailPlugin, softDeletePlugin } from '../../../database/mongoose-plugins';

export type EmployeeDocument = HydratedDocument<Employee>;

@Schema({ _id: false })
export class Dependent {
  @Prop({ required: true })
  nome: string;

  @Prop({ required: true })
  cpf: string;

  @Prop({ required: true, type: Date })
  dataNascimento: Date;

  @Prop({ required: true, enum: ['filho', 'conjuge', 'pai_mae', 'outro'] })
  parentesco: string;

  @Prop({ default: true })
  deducaoIrrf: boolean;
}

export const DependentSchema = SchemaFactory.createForClass(Dependent);

@Schema({ timestamps: true, collection: 'employees' })
export class Employee {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  // Dados pessoais
  @ApiProperty()
  @Prop({ required: true, trim: true })
  nome: string;

  @ApiProperty()
  @Prop({ required: true })
  cpf: string;

  @Prop()
  rg: string;

  @Prop({ type: Date })
  dataNascimento: Date;

  @Prop()
  pis: string;

  // Dados do emprego
  @ApiProperty()
  @Prop({ required: true })
  cargo: string;

  @ApiProperty()
  @Prop()
  departamento: string;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  salarioBase: Types.Decimal128;

  @ApiProperty()
  @Prop({ required: true, type: Date })
  dataAdmissao: Date;

  @Prop({ type: Date })
  dataDemissao: Date;

  @ApiProperty({ enum: StatusFuncionario })
  @Prop({ required: true, enum: Object.values(StatusFuncionario), default: StatusFuncionario.Ativo })
  status: StatusFuncionario;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', sparse: true })
  userId: Types.ObjectId;

  // Dados bancarios
  @Prop(
    raw({
      banco: { type: String },
      agencia: { type: String },
      conta: { type: String },
      tipoConta: { type: String, enum: ['corrente', 'poupanca'] },
    }),
  )
  dadosBancarios: Record<string, any>;

  // Dependentes
  @Prop({ type: [DependentSchema], default: [] })
  dependentes: Dependent[];

  // Endereco
  @Prop(
    raw({
      cep: { type: String },
      logradouro: { type: String },
      numero: { type: String },
      complemento: { type: String },
      bairro: { type: String },
      cidade: { type: String },
      uf: { type: String },
    }),
  )
  endereco: Record<string, any>;

  createdBy?: MongooseSchema.Types.ObjectId;
  updatedBy?: MongooseSchema.Types.ObjectId;
  deletedAt?: Date | null;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);

EmployeeSchema.plugin(auditTrailPlugin);
EmployeeSchema.plugin(softDeletePlugin);

EmployeeSchema.index({ tenantId: 1, companyId: 1, cpf: 1 }, { unique: true });
EmployeeSchema.index({ tenantId: 1, companyId: 1, status: 1 });
