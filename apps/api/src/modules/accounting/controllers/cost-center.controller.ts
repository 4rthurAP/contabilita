import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CostCenterService } from '../services/cost-center.service';
import { CreateCostCenterDto } from '../dto/create-cost-center.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../tenant/guards/tenant.guard';
import { RolesGuard } from '../../tenant/guards/roles.guard';
import { AbilitiesGuard } from '../../../common/guards/abilities.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CheckAbilities } from '../../../common/decorators/check-abilities.decorator';
import { TenantRole } from '@contabilita/shared';

@ApiTags('Centros de Custo')
@Controller('companies/:companyId/cost-centers')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, AbilitiesGuard)
@ApiBearerAuth()
export class CostCenterController {
  constructor(private readonly costCenterService: CostCenterService) {}

  @Post()
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['create', 'Account'])
  @ApiOperation({ summary: 'Criar centro de custo' })
  create(@Param('companyId') companyId: string, @Body() dto: CreateCostCenterDto) {
    return this.costCenterService.create(companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar centros de custo' })
  findAll(@Param('companyId') companyId: string) {
    return this.costCenterService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter centro de custo por ID' })
  findOne(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.costCenterService.findById(companyId, id);
  }

  @Put(':id')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['update', 'Account'])
  @ApiOperation({ summary: 'Atualizar centro de custo' })
  update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateCostCenterDto>,
  ) {
    return this.costCenterService.update(companyId, id, dto);
  }

  @Delete(':id')
  @Roles(TenantRole.Owner, TenantRole.Admin)
  @CheckAbilities(['delete', 'Account'])
  @ApiOperation({ summary: 'Remover centro de custo' })
  remove(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.costCenterService.remove(companyId, id);
  }
}
