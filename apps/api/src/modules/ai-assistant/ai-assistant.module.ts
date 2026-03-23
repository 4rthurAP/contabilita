import { Module } from '@nestjs/common';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';
import { TenantModule } from '../tenant/tenant.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { ObligationsModule } from '../obligations/obligations.module';

@Module({
  imports: [TenantModule, DashboardModule, ObligationsModule],
  controllers: [AiAssistantController],
  providers: [AiAssistantService],
})
export class AiAssistantModule {}
