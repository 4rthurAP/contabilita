import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Certificate, CertificateSchema } from './schemas/certificate.schema';
import { CertificateService } from './certificate.service';
import { CertificateController } from './certificate.controller';
import { CertificateScheduler } from './certificate.scheduler';
import { TenantModule } from '../tenant/tenant.module';
import certificateConfig from '../../config/certificate.config';

@Module({
  imports: [
    ConfigModule.forFeature(certificateConfig),
    MongooseModule.forFeature([
      { name: Certificate.name, schema: CertificateSchema },
    ]),
    TenantModule,
  ],
  controllers: [CertificateController],
  providers: [CertificateService, CertificateScheduler],
  exports: [CertificateService],
})
export class CertificateModule {}
