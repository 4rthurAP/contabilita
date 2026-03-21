import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { tenantScopedPlugin } from '../../../database/mongoose-plugins/tenant-scoped.plugin';
import { auditTrailPlugin } from '../../../database/mongoose-plugins/audit-trail.plugin';
import { softDeletePlugin } from '../../../database/mongoose-plugins/soft-delete.plugin';

export type BankAccountDocument = HydratedDocument<BankAccount>;

@Schema({ timestamps: true, collection: 'bank_accounts' })
export class BankAccount {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Codigo do banco (ex: 001, 237, 341)' })
  @Prop({ required: true })
  codigoBanco: string;

  @ApiProperty({ description: 'Nome do banco' })
  @Prop({ required: true })
  nomeBanco: string;

  @ApiProperty({ description: 'Numero da agencia' })
  @Prop({ required: true })
  agencia: string;

  @ApiProperty({ description: 'Numero da conta com digito' })
  @Prop({ required: true })
  numeroConta: string;

  @ApiProperty({ description: 'Nome amigavel (ex: "Conta Principal BB")' })
  @Prop({ required: true })
  apelido: string;

  /** ID da conta contabil associada (Banco c/ Movimento) */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
  contaContabilId?: MongooseSchema.Types.ObjectId;

  @ApiProperty({ default: true })
  @Prop({ default: true })
  isActive: boolean;
}

export const BankAccountSchema = SchemaFactory.createForClass(BankAccount);
BankAccountSchema.plugin(tenantScopedPlugin);
BankAccountSchema.plugin(auditTrailPlugin);
BankAccountSchema.plugin(softDeletePlugin);
BankAccountSchema.index({ tenantId: 1, companyId: 1, codigoBanco: 1, numeroConta: 1 }, { unique: true });
