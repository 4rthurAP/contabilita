import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @ApiProperty()
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty()
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: false, default: null })
  password: string | null;

  @ApiProperty()
  @Prop({ required: false, sparse: true, unique: true })
  cpf: string | null;

  @ApiProperty()
  @Prop({ type: String, default: 'local', enum: ['local', 'google'] })
  authProvider: 'local' | 'google';

  @Prop({ type: String, default: null, sparse: true, unique: true })
  googleId: string | null;

  @Prop({ type: String, default: null })
  avatarUrl: string | null;

  @ApiProperty()
  @Prop({ default: false })
  isSuperAdmin: boolean;

  @Prop({ type: String, default: null })
  refreshToken: string | null;

  @Prop({ type: Number, default: 0 })
  failedLoginAttempts: number;

  @Prop({ type: Date, default: null })
  lockedUntil: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
