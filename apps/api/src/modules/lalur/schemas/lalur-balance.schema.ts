import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type LalurBalanceDocument = HydratedDocument<LalurBalance>;

/**
 * LALUR Parte B - Controle de saldos.
 * Registra prejuizos fiscais acumulados, diferencas temporarias,
 * e outros valores que transitam entre periodos.
 */
@Schema({ timestamps: true, collection: 'lalur_balances' })
export class LalurBalance {
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

  @ApiProperty({ enum: ['prejuizo_fiscal', 'base_negativa_csll', 'diferenca_temporaria', 'outro'] })
  @Prop({ required: true })
  tipo: string;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  saldoInicial: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  adicoes: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  baixas: Types.Decimal128;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Decimal128, default: '0' })
  saldoFinal: Types.Decimal128;

  @ApiProperty()
  @Prop({ required: true })
  year: number;
}

export const LalurBalanceSchema = SchemaFactory.createForClass(LalurBalance);
LalurBalanceSchema.index({ tenantId: 1, companyId: 1, year: 1, codigo: 1 }, { unique: true });
