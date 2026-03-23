import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WidgetDefinition, WidgetDefinitionSchema } from './schemas/widget-definition.schema';
import { BiService } from './bi.service';
import { TenantModule } from '../tenant/tenant.module';
import { Invoice, InvoiceSchema } from '../fiscal/schemas/invoice.schema';
import { TaxPayment, TaxPaymentSchema } from '../fiscal/schemas/tax-payment.schema';
import { Obligation, ObligationSchema } from '../obligations/schemas/obligation.schema';
import { BankTransaction, BankTransactionSchema } from '../bank-reconciliation/schemas/bank-transaction.schema';
import { Company, CompanySchema } from '../company/schemas/company.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WidgetDefinition.name, schema: WidgetDefinitionSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: TaxPayment.name, schema: TaxPaymentSchema },
      { name: Obligation.name, schema: ObligationSchema },
      { name: BankTransaction.name, schema: BankTransactionSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    TenantModule,
  ],
  providers: [BiService],
  exports: [BiService],
})
export class BiModule {}
