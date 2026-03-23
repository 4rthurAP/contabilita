import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Certidao, CertidaoSchema } from './schemas/certidao.schema';
import { CertidaoFetchProcessor } from './processors/certidao-fetch.processor';
import { TenantModule } from '../tenant/tenant.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Certidao.name, schema: CertidaoSchema },
    ]),
    TenantModule,
    QueueModule,
  ],
  providers: [CertidaoFetchProcessor],
  exports: [],
})
export class CertidaoModule {}
