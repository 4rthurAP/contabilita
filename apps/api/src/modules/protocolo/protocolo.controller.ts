import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProtocoloService } from './protocolo.service';
import { CreateProtocoloDto } from './dto/create-protocolo.dto';
import { UpdateProtocoloStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';

@ApiTags('Protocolos')
@Controller('companies/:companyId/protocolos')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class ProtocoloController {
  constructor(private readonly protocoloService: ProtocoloService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar novo protocolo' })
  create(@Param('companyId') companyId: string, @Body() dto: CreateProtocoloDto) {
    return this.protocoloService.create(companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar protocolos' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'tipo', required: false })
  findAll(
    @Param('companyId') companyId: string,
    @Query('status') status?: string,
    @Query('tipo') tipo?: string,
  ) {
    return this.protocoloService.findAll(companyId, status, tipo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter protocolo por ID' })
  findOne(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.protocoloService.findById(companyId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do protocolo' })
  updateStatus(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProtocoloStatusDto,
  ) {
    return this.protocoloService.updateStatus(companyId, id, dto);
  }
}
