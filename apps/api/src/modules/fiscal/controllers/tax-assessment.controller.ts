import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TaxAssessmentService } from '../services/tax-assessment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../tenant/guards/tenant.guard';

@ApiTags('Apuracao Fiscal')
@Controller('companies/:companyId/tax-assessments')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class TaxAssessmentController {
  constructor(private readonly taxAssessmentService: TaxAssessmentService) {}

  @Post(':year/:month/recalculate')
  @ApiOperation({ summary: 'Recalcular apuracao mensal de impostos' })
  recalculate(
    @Param('companyId') companyId: string,
    @Param('year') year: number,
    @Param('month') month: number,
  ) {
    return this.taxAssessmentService.recalculate(companyId, year, month);
  }

  @Get(':year/:month')
  @ApiOperation({ summary: 'Obter apuracao de um mes especifico' })
  findByPeriod(
    @Param('companyId') companyId: string,
    @Param('year') year: number,
    @Param('month') month: number,
  ) {
    return this.taxAssessmentService.findByPeriod(companyId, year, month);
  }

  @Get()
  @ApiOperation({ summary: 'Listar apuracoes fiscais' })
  @ApiQuery({ name: 'year', required: false })
  findAll(@Param('companyId') companyId: string, @Query('year') year?: number) {
    return this.taxAssessmentService.findAll(companyId, year);
  }
}
