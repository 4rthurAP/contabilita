import { Controller, Get, Post, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountingPeriodService } from '../services/accounting-period.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../tenant/guards/tenant.guard';
import { RolesGuard } from '../../tenant/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { TenantRole } from '@contabilita/shared';

@ApiTags('Periodos Contabeis')
@Controller('companies/:companyId/accounting-periods')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class AccountingPeriodController {
  constructor(private readonly periodService: AccountingPeriodService) {}

  @Get()
  @ApiOperation({ summary: 'Listar periodos contabeis' })
  @ApiQuery({ name: 'year', required: false })
  findAll(@Param('companyId') companyId: string, @Query('year') year?: number) {
    return this.periodService.findAll(companyId, year);
  }

  @Post(':year/:month')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @ApiOperation({ summary: 'Abrir periodo contabil' })
  open(
    @Param('companyId') companyId: string,
    @Param('year') year: number,
    @Param('month') month: number,
  ) {
    return this.periodService.openPeriod(companyId, year, month);
  }

  @Patch(':id/close')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @ApiOperation({ summary: 'Fechar periodo contabil' })
  close(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.periodService.closePeriod(companyId, id);
  }

  @Patch(':id/reopen')
  @Roles(TenantRole.Owner, TenantRole.Admin)
  @ApiOperation({ summary: 'Reabrir periodo contabil (apenas Owner/Admin)' })
  reopen(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.periodService.reopenPeriod(companyId, id);
  }
}
