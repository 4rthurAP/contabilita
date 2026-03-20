import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tarefa, TarefaSchema } from './schemas/tarefa.schema';
import { AdministrarService } from './administrar.service';
import { AdministrarController } from './administrar.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tarefa.name, schema: TarefaSchema },
    ]),
    TenantModule,
  ],
  controllers: [AdministrarController],
  providers: [AdministrarService],
  exports: [AdministrarService],
})
export class AdministrarModule {}
