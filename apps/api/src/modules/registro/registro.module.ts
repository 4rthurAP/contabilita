import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Registro, RegistroSchema } from './schemas/registro.schema';
import { AtividadeRegistro, AtividadeRegistroSchema } from './schemas/atividade-registro.schema';
import { RegistroService } from './registro.service';
import { RegistroController } from './registro.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Registro.name, schema: RegistroSchema },
      { name: AtividadeRegistro.name, schema: AtividadeRegistroSchema },
    ]),
    TenantModule,
  ],
  controllers: [RegistroController],
  providers: [RegistroService],
  exports: [RegistroService],
})
export class RegistroModule {}
