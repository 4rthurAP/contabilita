import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyGroup, CompanyGroupSchema } from './schemas/company-group.schema';
import { ConsolidationService } from './consolidation.service';
import { TenantModule } from '../tenant/tenant.module';
import { JournalEntry, JournalEntrySchema } from '../accounting/schemas/journal-entry.schema';
import { Invoice, InvoiceSchema } from '../fiscal/schemas/invoice.schema';
import { Account, AccountSchema } from '../accounting/schemas/account.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CompanyGroup.name, schema: CompanyGroupSchema },
      { name: JournalEntry.name, schema: JournalEntrySchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
    TenantModule,
  ],
  providers: [ConsolidationService],
  exports: [ConsolidationService],
})
export class ConsolidationModule {}
