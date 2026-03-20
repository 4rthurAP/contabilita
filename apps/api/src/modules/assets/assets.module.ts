import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FixedAsset, FixedAssetSchema } from './schemas/fixed-asset.schema';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: FixedAsset.name, schema: FixedAssetSchema }]),
    TenantModule,
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
