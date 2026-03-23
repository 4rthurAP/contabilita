import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PortalBrandingDocument = HydratedDocument<PortalBranding>;

/**
 * Configuracao de branding do portal white-label.
 * Cada tenant pode personalizar logo, cores e dominio.
 */
@Schema({ timestamps: true, collection: 'portal_brandings' })
export class PortalBranding {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, unique: true })
  tenantId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop()
  logoUrl?: string;

  @ApiProperty()
  @Prop()
  faviconUrl?: string;

  @ApiProperty()
  @Prop({ default: '#1d4ed8' })
  primaryColor: string;

  @ApiProperty()
  @Prop({ default: '#f8fafc' })
  backgroundColor: string;

  @ApiProperty()
  @Prop()
  portalTitle?: string;

  /** Dominio customizado (ex: portal.contabilidade-xyz.com.br) */
  @ApiProperty()
  @Prop()
  customDomain?: string;

  /** Texto do rodape */
  @Prop()
  footerText?: string;

  /** Habilitar upload de documentos pelo cliente */
  @Prop({ default: true })
  enableDocumentUpload: boolean;

  /** Habilitar mensagens entre cliente e contador */
  @Prop({ default: true })
  enableMessaging: boolean;

  /** Habilitar visualizacao de folha de pagamento */
  @Prop({ default: true })
  enablePayroll: boolean;
}

export const PortalBrandingSchema = SchemaFactory.createForClass(PortalBranding);
