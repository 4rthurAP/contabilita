import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FixedAsset, FixedAssetSchema } from './schemas/fixed-asset.schema';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { AssetDepreciationScheduler } from './assets.scheduler';
import { AssetDepreciatedListener } from './listeners/asset-depreciated.listener';
import { TenantModule } from '../tenant/tenant.module';
import { AccountingModule } from '../accounting/accounting.module';
import { Company, CompanySchema } from '../company/schemas/company.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FixedAsset.name, schema: FixedAssetSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    TenantModule,
    AccountingModule,
  ],
  controllers: [AssetsController],
  providers: [AssetsService, AssetDepreciationScheduler, AssetDepreciatedListener],
  exports: [AssetsService],
})
export class AssetsModule {}
