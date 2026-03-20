import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';

@ApiTags('Relatorios')
@Controller('companies/:companyId/reports')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('balanco-patrimonial')
  @ApiOperation({ summary: 'Balanco Patrimonial' })
  @ApiQuery({ name: 'endDate', required: true })
  getBalancoPatrimonial(@Param('companyId') companyId: string, @Query('endDate') endDate: string) {
    return this.reportsService.getBalancoPatrimonial(companyId, endDate);
  }

  @Get('dre')
  @ApiOperation({ summary: 'Demonstracao do Resultado do Exercicio (DRE)' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  getDRE(
    @Param('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getDRE(companyId, startDate, endDate);
  }

  @Get('indicadores')
  @ApiOperation({ summary: 'Indicadores financeiros (liquidez, rentabilidade, endividamento)' })
  @ApiQuery({ name: 'endDate', required: true })
  getIndicadores(@Param('companyId') companyId: string, @Query('endDate') endDate: string) {
    return this.reportsService.getIndicadores(companyId, endDate);
  }
}
