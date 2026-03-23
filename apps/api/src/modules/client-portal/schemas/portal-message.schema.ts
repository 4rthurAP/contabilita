import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PortalMessageDocument = HydratedDocument<PortalMessage>;

@Schema({ timestamps: true, collection: 'portal_messages' })
export class PortalMessage {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  senderType: 'client' | 'accountant';

  @Prop({ type: MongooseSchema.Types.ObjectId })
  senderId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  subject: string;

  @ApiProperty()
  @Prop({ required: true })
  body: string;

  /** Chaves de arquivos anexados (StorageService) */
  @Prop({ type: [String], default: [] })
  attachmentKeys: string[];

  @Prop({ default: false })
  read: boolean;

  @Prop({ type: Date })
  readAt?: Date;
}

export const PortalMessageSchema = SchemaFactory.createForClass(PortalMessage);
PortalMessageSchema.index({ tenantId: 1, companyId: 1, createdAt: -1 });
