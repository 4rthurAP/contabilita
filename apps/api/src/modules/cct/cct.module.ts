import { Module } from '@nestjs/common';
import { CctController } from './cct.controller';
import { CctService } from './cct.service';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [CctController],
  providers: [CctService],
  exports: [CctService],
})
export class CctModule {}
