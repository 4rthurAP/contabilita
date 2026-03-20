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

  @Prop({ required: true })
  password: string;

  @ApiProperty()
  @Prop({ required: true, unique: true })
  cpf: string;

  @ApiProperty()
  @Prop({ default: false })
  isSuperAdmin: boolean;

  @Prop({ default: null })
  refreshToken: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
