import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BuscaNfeLog, BuscaNfeLogSchema } from './schemas/busca-nfe-log.schema';
import { BuscaNfeService } from './busca-nfe.service';
import { BuscaNfeController } from './busca-nfe.controller';
import { BuscaNfeScheduler } from './busca-nfe.scheduler';
import { NfeDistributionProcessor } from './processors/nfe-distribution.processor';
import { TenantModule } from '../tenant/tenant.module';
import { QueueModule } from '../queue/queue.module';
import { CertificateModule } from '../certificate/certificate.module';
import { Company, CompanySchema } from '../company/schemas/company.schema';
import { Certificate, CertificateSchema } from '../certificate/schemas/certificate.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BuscaNfeLog.name, schema: BuscaNfeLogSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Certificate.name, schema: CertificateSchema },
    ]),
    TenantModule,
    QueueModule,
    CertificateModule,
  ],
  controllers: [BuscaNfeController],
  providers: [BuscaNfeService, BuscaNfeScheduler, NfeDistributionProcessor],
  exports: [BuscaNfeService],
})
export class BuscaNfeModule {}
