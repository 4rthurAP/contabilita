import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RegistroService } from './registro.service';
import { CreateRegistroDto, CreateAtividadeRegistroDto } from './dto/create-registro.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { StatusRegistro } from '@contabilita/shared';

@ApiTags('Registros')
@Controller('companies/:companyId/registros')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class RegistroController {
  constructor(private readonly registroService: RegistroService) {}

  @Post()
  @ApiOperation({ summary: 'Criar registro societario' })
  create(@Param('companyId') companyId: string, @Body() dto: CreateRegistroDto) {
    return this.registroService.create(companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar registros societarios' })
  @ApiQuery({ name: 'status', required: false, enum: StatusRegistro })
  findAll(@Param('companyId') companyId: string, @Query('status') status?: string) {
    return this.registroService.findAll(companyId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter registro com atividades' })
  findOne(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.registroService.findOne(companyId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do registro' })
  updateStatus(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body('status') status: StatusRegistro,
  ) {
    return this.registroService.updateStatus(companyId, id, status);
  }

  // ── Atividades ────────────────────────────────

  @Post(':id/atividades')
  @ApiOperation({ summary: 'Adicionar atividade ao registro' })
  addAtividade(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: CreateAtividadeRegistroDto,
  ) {
    return this.registroService.addAtividade(companyId, id, dto);
  }

  @Patch(':id/atividades/:atividadeId/toggle')
  @ApiOperation({ summary: 'Alternar conclusao da atividade' })
  toggleAtividade(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Param('atividadeId') atividadeId: string,
  ) {
    return this.registroService.toggleAtividade(companyId, id, atividadeId);
  }

  @Delete(':id/atividades/:atividadeId')
  @ApiOperation({ summary: 'Remover atividade do registro' })
  deleteAtividade(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Param('atividadeId') atividadeId: string,
  ) {
    return this.registroService.deleteAtividade(companyId, id, atividadeId);
  }
}
