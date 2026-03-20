import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  userId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ enum: ['prazo_fiscal', 'vencimento_guia', 'folha_pendente', 'sped_pendente', 'geral'] })
  @Prop({ required: true })
  tipo: string;

  @ApiProperty()
  @Prop({ required: true })
  titulo: string;

  @ApiProperty()
  @Prop({ required: true })
  mensagem: string;

  @ApiProperty()
  @Prop({ default: false })
  lida: boolean;

  @Prop()
  link: string;

  @Prop({ type: Date })
  dataReferencia: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ tenantId: 1, userId: 1, lida: 1, createdAt: -1 });
