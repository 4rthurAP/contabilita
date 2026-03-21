import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'KPIs do dashboard (empresas, lancamentos, guias, etc.)' })
  @ApiQuery({ name: 'companyId', required: false })
  getSummary(@Query('companyId') companyId?: string) {
    return this.dashboardService.getSummary(companyId);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Atividades recentes (audit log)' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getActivity(@Query('companyId') companyId?: string, @Query('limit') limit?: string) {
    return this.dashboardService.getActivity(companyId, limit ? parseInt(limit, 10) : 10);
  }

  @Get('charts/dre-trend')
  @ApiOperation({ summary: 'Tendencia DRE — receita/despesa/resultado por mes' })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'months', required: false })
  getDreTrend(@Query('companyId') companyId: string, @Query('months') months?: string) {
    return this.dashboardService.getDreTrend(companyId, months ? parseInt(months, 10) : 12);
  }

  @Get('charts/tax-burden')
  @ApiOperation({ summary: 'Carga tributaria por tipo de imposto no ano' })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'year', required: false })
  getTaxBurden(@Query('companyId') companyId: string, @Query('year') year?: string) {
    return this.dashboardService.getTaxBurden(companyId, year ? parseInt(year, 10) : undefined);
  }
}
