import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdministrarService } from './administrar.service';
import { CreateTarefaDto, UpdateTarefaDto } from './dto/create-tarefa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../tenant/guards/roles.guard';
import { AbilitiesGuard } from '../../common/guards/abilities.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CheckAbilities } from '../../common/decorators/check-abilities.decorator';
import { StatusTarefa, PrioridadeTarefa, TenantRole } from '@contabilita/shared';

@ApiTags('Tarefas')
@Controller('tarefas')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, AbilitiesGuard)
@ApiBearerAuth()
export class AdministrarController {
  constructor(private readonly administrarService: AdministrarService) {}

  @Post()
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['create', 'Administrar'])
  @ApiOperation({ summary: 'Criar tarefa' })
  create(@Body() dto: CreateTarefaDto) {
    return this.administrarService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tarefas com filtros' })
  @ApiQuery({ name: 'status', required: false, enum: StatusTarefa })
  @ApiQuery({ name: 'prioridade', required: false, enum: PrioridadeTarefa })
  @ApiQuery({ name: 'userId', required: false })
  findAll(
    @Query('status') status?: string,
    @Query('prioridade') prioridade?: string,
    @Query('userId') userId?: string,
  ) {
    return this.administrarService.findAll({ status, prioridade, userId });
  }

  @Patch(':id')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['update', 'Administrar'])
  @ApiOperation({ summary: 'Atualizar tarefa' })
  update(@Param('id') id: string, @Body() dto: UpdateTarefaDto) {
    return this.administrarService.update(id, dto);
  }

  @Patch(':id/complete')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['update', 'Administrar'])
  @ApiOperation({ summary: 'Concluir tarefa' })
  complete(@Param('id') id: string) {
    return this.administrarService.complete(id);
  }

  @Get('productivity/:year/:month')
  @ApiOperation({ summary: 'Produtividade mensal por usuario' })
  getProductivity(@Param('year') year: string, @Param('month') month: string) {
    return this.administrarService.getProductivity(Number(year), Number(month));
  }
}
