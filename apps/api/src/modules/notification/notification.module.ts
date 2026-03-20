import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { Obligation, ObligationSchema } from '../obligations/schemas/obligation.schema';
import { TaxPayment, TaxPaymentSchema } from '../fiscal/schemas/tax-payment.schema';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: Obligation.name, schema: ObligationSchema },
      { name: TaxPayment.name, schema: TaxPaymentSchema },
    ]),
    TenantModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
