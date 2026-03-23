import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Contrato, ContratoSchema } from './schemas/contrato.schema';
import { Cobranca, CobrancaSchema } from './schemas/cobranca.schema';
import { ContratoService } from './services/contrato.service';
import { CobrancaService } from './services/cobranca.service';
import { HonorariosScheduler } from './honorarios.scheduler';
import { ContratoController } from './controllers/contrato.controller';
import { CobrancaController } from './controllers/cobranca.controller';
import { TenantModule } from '../tenant/tenant.module';
import { NotificationModule } from '../notification/notification.module';
import { Company, CompanySchema } from '../company/schemas/company.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contrato.name, schema: ContratoSchema },
      { name: Cobranca.name, schema: CobrancaSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    TenantModule,
    NotificationModule,
  ],
  controllers: [ContratoController, CobrancaController],
  providers: [ContratoService, CobrancaService, HonorariosScheduler],
  exports: [ContratoService, CobrancaService],
})
export class HonorariosModule {}
