import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Workflow, WorkflowSchema } from './schemas/workflow.schema';
import { WorkflowEngineService } from './workflow-engine.service';
import { TenantModule } from '../tenant/tenant.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Workflow.name, schema: WorkflowSchema }]),
    TenantModule,
    NotificationModule,
  ],
  providers: [WorkflowEngineService],
  exports: [WorkflowEngineService],
})
export class WorkflowModule {}
