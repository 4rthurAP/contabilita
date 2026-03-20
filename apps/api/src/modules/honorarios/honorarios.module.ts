import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Contrato, ContratoSchema } from './schemas/contrato.schema';
import { Cobranca, CobrancaSchema } from './schemas/cobranca.schema';
import { ContratoService } from './services/contrato.service';
import { CobrancaService } from './services/cobranca.service';
import { ContratoController } from './controllers/contrato.controller';
import { CobrancaController } from './controllers/cobranca.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contrato.name, schema: ContratoSchema },
      { name: Cobranca.name, schema: CobrancaSchema },
    ]),
    TenantModule,
  ],
  controllers: [ContratoController, CobrancaController],
  providers: [ContratoService, CobrancaService],
  exports: [ContratoService, CobrancaService],
})
export class HonorariosModule {}
