import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BankAccount, BankAccountSchema } from './schemas/bank-account.schema';
import { BankTransaction, BankTransactionSchema } from './schemas/bank-transaction.schema';
import { BankReconciliationService } from './services/bank-reconciliation.service';
import { OfxParserService } from './services/ofx-parser.service';
import { BankReconciliationController } from './bank-reconciliation.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BankAccount.name, schema: BankAccountSchema },
      { name: BankTransaction.name, schema: BankTransactionSchema },
    ]),
    TenantModule,
  ],
  controllers: [BankReconciliationController],
  providers: [BankReconciliationService, OfxParserService],
  exports: [BankReconciliationService],
})
export class BankReconciliationModule {}
