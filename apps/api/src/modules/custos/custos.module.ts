import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimeEntry, TimeEntrySchema } from './schemas/time-entry.schema';
import { CustoFixo, CustoFixoSchema } from './schemas/custo-fixo.schema';
import { CustosController } from './custos.controller';
import { CustosService } from './custos.service';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TimeEntry.name, schema: TimeEntrySchema },
      { name: CustoFixo.name, schema: CustoFixoSchema },
    ]),
    TenantModule,
  ],
  controllers: [CustosController],
  providers: [CustosService],
  exports: [CustosService],
})
export class CustosModule {}
