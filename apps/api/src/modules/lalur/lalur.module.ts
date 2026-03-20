import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LalurEntry, LalurEntrySchema } from './schemas/lalur-entry.schema';
import { LalurBalance, LalurBalanceSchema } from './schemas/lalur-balance.schema';
import { LalurService } from './lalur.service';
import { LalurController } from './lalur.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LalurEntry.name, schema: LalurEntrySchema },
      { name: LalurBalance.name, schema: LalurBalanceSchema },
    ]),
    TenantModule,
  ],
  controllers: [LalurController],
  providers: [LalurService],
  exports: [LalurService],
})
export class LalurModule {}
