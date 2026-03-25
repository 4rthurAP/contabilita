import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../tenant/guards/roles.guard';
import { AbilitiesGuard } from '../../common/guards/abilities.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CheckAbilities } from '../../common/decorators/check-abilities.decorator';
import { TenantRole } from '@contabilita/shared';

@ApiTags('Patrimonio')
@Controller('companies/:companyId/assets')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, AbilitiesGuard)
@ApiBearerAuth()
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['create', 'Asset'])
  @ApiOperation({ summary: 'Cadastrar bem patrimonial' })
  create(@Param('companyId') companyId: string, @Body() dto: CreateAssetDto) {
    return this.assetsService.create(companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar bens' })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Param('companyId') companyId: string, @Query('status') status?: string) {
    return this.assetsService.findAll(companyId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter bem por ID' })
  findOne(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.assetsService.findById(companyId, id);
  }

  @Post('depreciate/:year/:month')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['create', 'Asset'])
  @ApiOperation({ summary: 'Executar depreciacao mensal' })
  depreciate(@Param('companyId') companyId: string, @Param('year') year: number, @Param('month') month: number) {
    return this.assetsService.runMonthlyDepreciation(companyId, year, month);
  }

  @Patch(':id/write-off')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['update', 'Asset'])
  @ApiOperation({ summary: 'Baixar bem' })
  writeOff(@Param('companyId') companyId: string, @Param('id') id: string, @Body('motivo') motivo: string) {
    return this.assetsService.writeOff(companyId, id, motivo);
  }

  @Patch(':id/revalue')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['update', 'Asset'])
  @ApiOperation({ summary: 'Reavaliar bem' })
  revalue(@Param('companyId') companyId: string, @Param('id') id: string, @Body() body: { novoValor: string; motivo: string }) {
    return this.assetsService.revalue(companyId, id, body.novoValor, body.motivo);
  }
}
