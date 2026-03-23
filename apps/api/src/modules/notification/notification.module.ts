import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { Obligation, ObligationSchema } from '../obligations/schemas/obligation.schema';
import { TaxPayment, TaxPaymentSchema } from '../fiscal/schemas/tax-payment.schema';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';
import { NotificationEmailProcessor } from './processors/notification-email.processor';
import { TenantModule } from '../tenant/tenant.module';
import { QueueModule } from '../queue/queue.module';
import { AuthModule } from '../auth/auth.module';
import mailConfig from '../../config/mail.config';

@Module({
  imports: [
    ConfigModule.forFeature(mailConfig),
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: Obligation.name, schema: ObligationSchema },
      { name: TaxPayment.name, schema: TaxPaymentSchema },
    ]),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('mail.host'),
          port: config.get<number>('mail.port'),
          secure: config.get<boolean>('mail.secure'),
          auth: {
            user: config.get<string>('mail.user'),
            pass: config.get<string>('mail.pass'),
          },
        },
        defaults: {
          from: config.get<string>('mail.from'),
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
    }),
    TenantModule,
    QueueModule,
    AuthModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway, NotificationEmailProcessor],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
