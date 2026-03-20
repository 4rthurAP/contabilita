import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { TenantRole } from '@contabilita/shared';

export type TenantUserDocument = HydratedDocument<TenantUser>;

@Schema({ timestamps: true, collection: 'tenant_users' })
export class TenantUser {
  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ enum: TenantRole })
  @Prop({ required: true, enum: Object.values(TenantRole), default: TenantRole.Viewer })
  role: TenantRole;

  @ApiProperty()
  @Prop({ default: true })
  isActive: boolean;
}

export const TenantUserSchema = SchemaFactory.createForClass(TenantUser);

TenantUserSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
