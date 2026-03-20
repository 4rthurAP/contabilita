import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TaxPaymentService } from '../services/tax-payment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../tenant/guards/tenant.guard';
import { IsDateString } from 'class-validator';

class MarkPaidDto {
  @IsDateString()
  dataPagamento: string;
}

@ApiTags('Guias de Pagamento')
@Controller('companies/:companyId/tax-payments')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class TaxPaymentController {
  constructor(private readonly taxPaymentService: TaxPaymentService) {}

  @Post('generate/:year/:month')
  @ApiOperation({ summary: 'Gerar guias a partir da apuracao mensal' })
  generate(
    @Param('companyId') companyId: string,
    @Param('year') year: number,
    @Param('month') month: number,
  ) {
    return this.taxPaymentService.generateFromAssessment(companyId, year, month);
  }

  @Get()
  @ApiOperation({ summary: 'Listar guias de pagamento' })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Param('companyId') companyId: string, @Query('status') status?: string) {
    return this.taxPaymentService.findAll(companyId, status);
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Marcar guia como paga' })
  markAsPaid(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: MarkPaidDto,
  ) {
    return this.taxPaymentService.markAsPaid(companyId, id, new Date(dto.dataPagamento));
  }
}
