import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BuscaNfeLog, BuscaNfeLogSchema } from './schemas/busca-nfe-log.schema';
import { BuscaNfeService } from './busca-nfe.service';
import { BuscaNfeController } from './busca-nfe.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BuscaNfeLog.name, schema: BuscaNfeLogSchema },
    ]),
    TenantModule,
  ],
  controllers: [BuscaNfeController],
  providers: [BuscaNfeService],
  exports: [BuscaNfeService],
})
export class BuscaNfeModule {}
