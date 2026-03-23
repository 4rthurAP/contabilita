import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BankAccount, BankAccountSchema } from './schemas/bank-account.schema';
import { BankTransaction, BankTransactionSchema } from './schemas/bank-transaction.schema';
import { BankReconciliationService } from './services/bank-reconciliation.service';
import { OfxParserService } from './services/ofx-parser.service';
import { BankReconciliationProcessor } from './processors/bank-reconciliation.processor';
import { BankReconciliationController } from './bank-reconciliation.controller';
import { TenantModule } from '../tenant/tenant.module';
import { QueueModule } from '../queue/queue.module';
import { Invoice, InvoiceSchema } from '../fiscal/schemas/invoice.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BankAccount.name, schema: BankAccountSchema },
      { name: BankTransaction.name, schema: BankTransactionSchema },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
    TenantModule,
    QueueModule,
  ],
  controllers: [BankReconciliationController],
  providers: [BankReconciliationService, OfxParserService, BankReconciliationProcessor],
  exports: [BankReconciliationService],
})
export class BankReconciliationModule {}
