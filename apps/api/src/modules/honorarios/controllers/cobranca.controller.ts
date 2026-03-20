import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CobrancaService } from '../services/cobranca.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../tenant/guards/tenant.guard';
import { FormaPagamento } from '@contabilita/shared';

@ApiTags('Honorarios - Cobrancas')
@Controller('companies/:companyId/cobrancas')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class CobrancaController {
  constructor(private readonly cobrancaService: CobrancaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar cobrancas' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'competencia', required: false })
  findAll(
    @Param('companyId') companyId: string,
    @Query('status') status?: string,
    @Query('competencia') competencia?: string,
  ) {
    return this.cobrancaService.findAll(companyId, status, competencia);
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Registrar pagamento de cobranca' })
  markAsPaid(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body('formaPagamento') formaPagamento: FormaPagamento,
  ) {
    return this.cobrancaService.markAsPaid(companyId, id, formaPagamento);
  }

  @Get('cash-flow/:year')
  @ApiOperation({ summary: 'Fluxo de caixa de honorarios por ano' })
  getCashFlow(@Param('companyId') companyId: string, @Param('year') year: number) {
    return this.cobrancaService.getCashFlow(companyId, year);
  }
}
