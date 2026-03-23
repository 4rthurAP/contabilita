import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EsocialEvent, EsocialEventSchema } from './schemas/esocial-event.schema';
import { EsocialEventGenerator } from './esocial-event.generator';
import { EsocialProcessor } from './processors/esocial.processor';
import { TenantModule } from '../tenant/tenant.module';
import { QueueModule } from '../queue/queue.module';
import { CertificateModule } from '../certificate/certificate.module';
import { Employee, EmployeeSchema } from '../payroll/schemas/employee.schema';
import { PayrollRun, PayrollRunSchema } from '../payroll/schemas/payroll-run.schema';
import { Company, CompanySchema } from '../company/schemas/company.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EsocialEvent.name, schema: EsocialEventSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: PayrollRun.name, schema: PayrollRunSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    TenantModule,
    QueueModule,
    CertificateModule,
  ],
  providers: [EsocialEventGenerator, EsocialProcessor],
  exports: [EsocialEventGenerator],
})
export class EsocialModule {}
