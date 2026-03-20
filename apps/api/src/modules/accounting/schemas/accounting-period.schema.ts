import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { StatusPeriodo } from '@contabilita/shared';

export type AccountingPeriodDocument = HydratedDocument<AccountingPeriod>;

@Schema({ timestamps: true, collection: 'accounting_periods' })
export class AccountingPeriod {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ example: 2024 })
  @Prop({ required: true })
  year: number;

  @ApiProperty({ example: 1, description: 'Mes (1-12)' })
  @Prop({ required: true, min: 1, max: 12 })
  month: number;

  @ApiProperty({ enum: StatusPeriodo })
  @Prop({ required: true, enum: Object.values(StatusPeriodo), default: StatusPeriodo.Aberto })
  status: StatusPeriodo;

  @ApiProperty()
  @Prop({ required: true, type: Date })
  startDate: Date;

  @ApiProperty()
  @Prop({ required: true, type: Date })
  endDate: Date;

  @Prop({ type: Date })
  closedAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  closedBy: MongooseSchema.Types.ObjectId;
}

export const AccountingPeriodSchema = SchemaFactory.createForClass(AccountingPeriod);

AccountingPeriodSchema.index(
  { tenantId: 1, companyId: 1, year: 1, month: 1 },
  { unique: true },
);
