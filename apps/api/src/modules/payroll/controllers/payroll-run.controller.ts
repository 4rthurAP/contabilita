import { Controller, Get, Post, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PayrollRunService } from '../services/payroll-run.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../tenant/guards/tenant.guard';
import { RolesGuard } from '../../tenant/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { TenantRole } from '@contabilita/shared';

@ApiTags('Folha de Pagamento')
@Controller('companies/:companyId/payroll-runs')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class PayrollRunController {
  constructor(private readonly payrollRunService: PayrollRunService) {}

  @Post(':year/:month')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @ApiOperation({ summary: 'Criar folha mensal' })
  create(
    @Param('companyId') companyId: string,
    @Param('year') year: number,
    @Param('month') month: number,
  ) {
    return this.payrollRunService.create(companyId, year, month);
  }

  @Patch(':id/calculate')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @ApiOperation({ summary: 'Calcular folha (gera holerites)' })
  calculate(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.payrollRunService.calculate(companyId, id);
  }

  @Patch(':id/approve')
  @Roles(TenantRole.Owner, TenantRole.Admin)
  @ApiOperation({ summary: 'Aprovar folha' })
  approve(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.payrollRunService.approve(companyId, id);
  }

  @Patch(':id/close')
  @Roles(TenantRole.Owner, TenantRole.Admin)
  @ApiOperation({ summary: 'Fechar folha' })
  close(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.payrollRunService.close(companyId, id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar folhas de pagamento' })
  @ApiQuery({ name: 'year', required: false })
  findAll(@Param('companyId') companyId: string, @Query('year') year?: number) {
    return this.payrollRunService.findAll(companyId, year);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter folha por ID' })
  findOne(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.payrollRunService.findById(companyId, id);
  }

  @Get(':id/payslips')
  @ApiOperation({ summary: 'Listar holerites da folha' })
  getPayslips(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.payrollRunService.getPayslips(companyId, id);
  }

  @Get('payslips/:payslipId')
  @ApiOperation({ summary: 'Obter holerite individual' })
  getPayslip(@Param('companyId') companyId: string, @Param('payslipId') payslipId: string) {
    return this.payrollRunService.getPayslip(companyId, payslipId);
  }
}
