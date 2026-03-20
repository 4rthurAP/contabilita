import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaxPayment, TaxPaymentSchema } from '../fiscal/schemas/tax-payment.schema';
import { TaxUpdateService } from './tax-update.service';
import { TaxUpdateController } from './tax-update.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TaxPayment.name, schema: TaxPaymentSchema }]),
    TenantModule,
  ],
  controllers: [TaxUpdateController],
  providers: [TaxUpdateService],
})
export class TaxUpdateModule {}
