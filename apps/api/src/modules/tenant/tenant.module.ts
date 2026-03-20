import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { TenantGuard } from './guards/tenant.guard';
import { RolesGuard } from './guards/roles.guard';
import { Tenant, TenantSchema } from './schemas/tenant.schema';
import { TenantUser, TenantUserSchema } from './schemas/tenant-user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: TenantUser.name, schema: TenantUserSchema },
    ]),
  ],
  controllers: [TenantController],
  providers: [TenantService, TenantGuard, RolesGuard],
  exports: [TenantService, TenantGuard, RolesGuard, MongooseModule],
})
export class TenantModule {}
