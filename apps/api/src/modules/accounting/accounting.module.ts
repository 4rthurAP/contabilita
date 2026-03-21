import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from './schemas/account.schema';
import { JournalEntry, JournalEntrySchema } from './schemas/journal-entry.schema';
import { CostCenter, CostCenterSchema } from './schemas/cost-center.schema';
import { AccountingPeriod, AccountingPeriodSchema } from './schemas/accounting-period.schema';
import { AccountService } from './services/account.service';
import { JournalEntryService } from './services/journal-entry.service';
import { CostCenterService } from './services/cost-center.service';
import { AccountingPeriodService } from './services/accounting-period.service';
import { AccountingTemplateService } from './services/accounting-template.service';
import { AccountingTemplate, AccountingTemplateSchema } from './schemas/accounting-template.schema';
import { AccountController } from './controllers/account.controller';
import { JournalEntryController } from './controllers/journal-entry.controller';
import { CostCenterController } from './controllers/cost-center.controller';
import { AccountingPeriodController } from './controllers/accounting-period.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
      { name: JournalEntry.name, schema: JournalEntrySchema },
      { name: CostCenter.name, schema: CostCenterSchema },
      { name: AccountingPeriod.name, schema: AccountingPeriodSchema },
      { name: AccountingTemplate.name, schema: AccountingTemplateSchema },
    ]),
    TenantModule,
  ],
  controllers: [
    AccountController,
    JournalEntryController,
    CostCenterController,
    AccountingPeriodController,
  ],
  providers: [AccountService, JournalEntryService, CostCenterService, AccountingPeriodService, AccountingTemplateService],
  exports: [AccountService, JournalEntryService, AccountingTemplateService],
})
export class AccountingModule {}
