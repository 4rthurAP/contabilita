import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Obligation, ObligationSchema } from './schemas/obligation.schema';
import { ObligationsService } from './obligations.service';
import { ObligationsController } from './obligations.controller';
import { SpedEcdGenerator } from './generators/sped-ecd.generator';
import { SpedEfdGenerator } from './generators/sped-efd.generator';
import { TenantModule } from '../tenant/tenant.module';
import { Account, AccountSchema } from '../accounting/schemas/account.schema';
import { JournalEntry, JournalEntrySchema } from '../accounting/schemas/journal-entry.schema';
import { Invoice, InvoiceSchema } from '../fiscal/schemas/invoice.schema';
import { Company, CompanySchema } from '../company/schemas/company.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Obligation.name, schema: ObligationSchema },
      { name: Account.name, schema: AccountSchema },
      { name: JournalEntry.name, schema: JournalEntrySchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    TenantModule,
  ],
  controllers: [ObligationsController],
  providers: [ObligationsService, SpedEcdGenerator, SpedEfdGenerator],
  exports: [ObligationsService],
})
export class ObligationsModule {}
