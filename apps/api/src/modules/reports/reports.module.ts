import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JournalEntry, JournalEntrySchema } from '../accounting/schemas/journal-entry.schema';
import { Account, AccountSchema } from '../accounting/schemas/account.schema';
import { GeneratedReport, GeneratedReportSchema } from './schemas/generated-report.schema';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportGenerationProcessor } from './processors/report-generation.processor';
import { TenantModule } from '../tenant/tenant.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JournalEntry.name, schema: JournalEntrySchema },
      { name: Account.name, schema: AccountSchema },
      { name: GeneratedReport.name, schema: GeneratedReportSchema },
    ]),
    TenantModule,
    QueueModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportGenerationProcessor],
  exports: [ReportsService],
})
export class ReportsModule {}
