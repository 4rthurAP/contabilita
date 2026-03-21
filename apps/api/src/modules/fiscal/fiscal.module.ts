import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { TaxAssessment, TaxAssessmentSchema } from './schemas/tax-assessment.schema';
import { TaxPayment, TaxPaymentSchema } from './schemas/tax-payment.schema';
import { InvoiceService } from './services/invoice.service';
import { TaxAssessmentService } from './services/tax-assessment.service';
import { TaxPaymentService } from './services/tax-payment.service';
import { TaxCalculationFactory } from './strategies/tax-calculation.factory';
import { InvoiceController } from './controllers/invoice.controller';
import { TaxAssessmentController } from './controllers/tax-assessment.controller';
import { TaxPaymentController } from './controllers/tax-payment.controller';
import { InvoicePostedListener } from './listeners/invoice-posted.listener';
import { FiscalScheduler } from './fiscal.scheduler';
import { TenantModule } from '../tenant/tenant.module';
import { AccountingModule } from '../accounting/accounting.module';
import { QueueModule } from '../queue/queue.module';
import { Company, CompanySchema } from '../company/schemas/company.schema';
import { XmlProcessingProcessor } from './processors/xml-processing.processor';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: TaxAssessment.name, schema: TaxAssessmentSchema },
      { name: TaxPayment.name, schema: TaxPaymentSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    TenantModule,
    AccountingModule,
    QueueModule,
  ],
  controllers: [InvoiceController, TaxAssessmentController, TaxPaymentController],
  providers: [
    InvoiceService,
    TaxAssessmentService,
    TaxPaymentService,
    TaxCalculationFactory,
    InvoicePostedListener,
    FiscalScheduler,
    XmlProcessingProcessor,
  ],
  exports: [InvoiceService, TaxAssessmentService, TaxPaymentService],
})
export class FiscalModule {}
