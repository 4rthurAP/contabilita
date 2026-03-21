import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Company, CompanySchema } from '../company/schemas/company.schema';
import { JournalEntry, JournalEntrySchema } from '../accounting/schemas/journal-entry.schema';
import { Account, AccountSchema } from '../accounting/schemas/account.schema';
import { Employee, EmployeeSchema } from '../payroll/schemas/employee.schema';
import { BankTransaction, BankTransactionSchema } from '../bank-reconciliation/schemas/bank-transaction.schema';
import { Obligation, ObligationSchema } from '../obligations/schemas/obligation.schema';
import { TaxPayment, TaxPaymentSchema } from '../fiscal/schemas/tax-payment.schema';
import { TaxAssessment, TaxAssessmentSchema } from '../fiscal/schemas/tax-assessment.schema';
import { AuditLog, AuditLogSchema } from '../audit/schemas/audit-log.schema';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: JournalEntry.name, schema: JournalEntrySchema },
      { name: Account.name, schema: AccountSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: BankTransaction.name, schema: BankTransactionSchema },
      { name: Obligation.name, schema: ObligationSchema },
      { name: TaxPayment.name, schema: TaxPaymentSchema },
      { name: TaxAssessment.name, schema: TaxAssessmentSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    TenantModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
