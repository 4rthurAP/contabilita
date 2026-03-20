import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type TenantDocument = HydratedDocument<Tenant>;

@Schema({ timestamps: true, collection: 'tenants' })
export class Tenant {
  @ApiProperty()
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty()
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @ApiProperty()
  @Prop({ required: true, unique: true })
  cnpj: string;

  @ApiProperty()
  @Prop({ default: 'starter', enum: ['starter', 'professional', 'enterprise'] })
  plan: string;

  @ApiProperty()
  @Prop({ default: 'active', enum: ['active', 'suspended', 'cancelled'] })
  status: string;

  @Prop(
    raw({
      certificadoDigital: { type: String, default: null },
      certificadoSenha: { type: String, default: null },
      certificadoValidade: { type: Date, default: null },
    }),
  )
  settings: Record<string, any>;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
