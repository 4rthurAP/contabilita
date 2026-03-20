import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TaxUpdateService } from './tax-update.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';

@ApiTags('Atualizar Impostos')
@Controller('companies/:companyId/tax-update')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class TaxUpdateController {
  constructor(private readonly taxUpdateService: TaxUpdateService) {}

  @Get('overdue')
  @ApiOperation({ summary: 'Listar impostos vencidos com multa e juros SELIC' })
  getOverdue(@Param('companyId') companyId: string) {
    return this.taxUpdateService.getOverdueTaxes(companyId);
  }

  @Get('calculate/:paymentId')
  @ApiOperation({ summary: 'Calcular atualizacao de um imposto especifico' })
  @ApiQuery({ name: 'dataCalculo', required: false })
  calculate(
    @Param('companyId') companyId: string,
    @Param('paymentId') paymentId: string,
    @Query('dataCalculo') dataCalculo?: string,
  ) {
    return this.taxUpdateService.calculateUpdate(companyId, paymentId, dataCalculo);
  }
}
