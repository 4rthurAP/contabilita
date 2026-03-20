import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JournalEntry, JournalEntrySchema } from '../accounting/schemas/journal-entry.schema';
import { Account, AccountSchema } from '../accounting/schemas/account.schema';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JournalEntry.name, schema: JournalEntrySchema },
      { name: Account.name, schema: AccountSchema },
    ]),
    TenantModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
