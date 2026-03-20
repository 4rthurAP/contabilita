import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientPortalController } from './client-portal.controller';
import { TenantModule } from '../tenant/tenant.module';
import { TaxPayment, TaxPaymentSchema } from '../fiscal/schemas/tax-payment.schema';
import { Obligation, ObligationSchema } from '../obligations/schemas/obligation.schema';
import { PayrollRun, PayrollRunSchema } from '../payroll/schemas/payroll-run.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaxPayment.name, schema: TaxPaymentSchema },
      { name: Obligation.name, schema: ObligationSchema },
      { name: PayrollRun.name, schema: PayrollRunSchema },
    ]),
    TenantModule,
  ],
  controllers: [ClientPortalController],
})
export class ClientPortalModule {}
