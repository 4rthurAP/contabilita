import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../tenant/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantRole } from '@contabilita/shared';
import { requireCurrentTenant } from '../tenant/tenant.context';
import { TaxPayment, TaxPaymentDocument } from '../fiscal/schemas/tax-payment.schema';
import { Obligation, ObligationDocument } from '../obligations/schemas/obligation.schema';
import { PayrollRun, PayrollRunDocument } from '../payroll/schemas/payroll-run.schema';

/**
 * Portal do cliente — acesso restrito (Viewer) para consulta de
 * guias, obrigacoes e folha de pagamento.
 */
@ApiTags('Portal do Cliente')
@Controller('companies/:companyId/portal')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class ClientPortalController {
  constructor(
    @InjectModel(TaxPayment.name) private paymentModel: Model<TaxPaymentDocument>,
    @InjectModel(Obligation.name) private obligationModel: Model<ObligationDocument>,
    @InjectModel(PayrollRun.name) private payrollModel: Model<PayrollRunDocument>,
  ) {}

  @Get('summary')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant, TenantRole.Analyst, TenantRole.Viewer)
  @ApiOperation({ summary: 'Resumo do portal do cliente' })
  async getSummary(@Param('companyId') companyId: string) {
    const ctx = requireCurrentTenant();
    const today = new Date();

    const [pendingPayments, pendingObligations, recentPayrolls] = await Promise.all([
      this.paymentModel.countDocuments({ tenantId: ctx.tenantId, companyId, status: 'pendente' }),
      this.obligationModel.countDocuments({ tenantId: ctx.tenantId, companyId, status: 'pendente' }),
      this.payrollModel.find({ tenantId: ctx.tenantId, companyId }).sort({ year: -1, month: -1 }).limit(3),
    ]);

    const overduePayments = await this.paymentModel.countDocuments({
      tenantId: ctx.tenantId, companyId, status: 'pendente', dataVencimento: { $lt: today },
    });

    return { pendingPayments, overduePayments, pendingObligations, recentPayrolls };
  }

  @Get('payments')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant, TenantRole.Analyst, TenantRole.Viewer)
  @ApiOperation({ summary: 'Listar guias de pagamento (portal)' })
  @ApiQuery({ name: 'status', required: false })
  async getPayments(@Param('companyId') companyId: string, @Query('status') status?: string) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, companyId };
    if (status) filter.status = status;
    return this.paymentModel.find(filter).sort({ dataVencimento: -1 }).limit(50);
  }

  @Get('obligations')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant, TenantRole.Analyst, TenantRole.Viewer)
  @ApiOperation({ summary: 'Listar obrigacoes (portal)' })
  async getObligations(@Param('companyId') companyId: string) {
    const ctx = requireCurrentTenant();
    return this.obligationModel
      .find({ tenantId: ctx.tenantId, companyId })
      .sort({ prazoEntrega: -1 })
      .limit(50);
  }
}
