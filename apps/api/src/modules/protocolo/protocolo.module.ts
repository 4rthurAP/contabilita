import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Protocolo, ProtocoloSchema } from './schemas/protocolo.schema';
import { ProtocoloController } from './protocolo.controller';
import { ProtocoloService } from './protocolo.service';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Protocolo.name, schema: ProtocoloSchema }]),
    TenantModule,
  ],
  controllers: [ProtocoloController],
  providers: [ProtocoloService],
  exports: [ProtocoloService],
})
export class ProtocoloModule {}
