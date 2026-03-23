import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Integration, IntegrationSchema } from './schemas/integration.schema';
import { IntegrationWebhookService } from './integration-webhook.service';
import { OpenBankingService } from './services/open-banking.service';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Integration.name, schema: IntegrationSchema },
    ]),
    TenantModule,
  ],
  providers: [IntegrationWebhookService, OpenBankingService],
  exports: [OpenBankingService],
})
export class IntegrationsModule {}
