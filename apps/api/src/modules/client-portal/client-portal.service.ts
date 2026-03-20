import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { requireCurrentTenant } from '../tenant/tenant.context';
import { TaxPayment, TaxPaymentDocument } from '../fiscal/schemas/tax-payment.schema';
import { Obligation, ObligationDocument } from '../obligations/schemas/obligation.schema';
import { PayrollRun, PayrollRunDocument } from '../payroll/schemas/payroll-run.schema';

@Injectable()
export class ClientPortalService {
  constructor(
    @InjectModel(TaxPayment.name) private paymentModel: Model<TaxPaymentDocument>,
    @InjectModel(Obligation.name) private obligationModel: Model<ObligationDocument>,
    @InjectModel(PayrollRun.name) private payrollModel: Model<PayrollRunDocument>,
  ) {}

  async getSummary(companyId: string) {
    const ctx = requireCurrentTenant();
    const today = new Date();

    const [pendingPayments, pendingObligations, recentPayrolls] = await Promise.all([
      this.paymentModel.countDocuments({
        tenantId: ctx.tenantId,
        companyId,
        status: 'pendente',
      }),
      this.obligationModel.countDocuments({
        tenantId: ctx.tenantId,
        companyId,
        status: 'pendente',
      }),
      this.payrollModel
        .find({ tenantId: ctx.tenantId, companyId })
        .sort({ year: -1, month: -1 })
        .limit(3),
    ]);

    const overduePayments = await this.paymentModel.countDocuments({
      tenantId: ctx.tenantId,
      companyId,
      status: 'pendente',
      dataVencimento: { $lt: today },
    });

    return { pendingPayments, overduePayments, pendingObligations, recentPayrolls };
  }

  async getPayments(companyId: string, status?: string) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, companyId };
    if (status) filter.status = status;
    return this.paymentModel.find(filter).sort({ dataVencimento: -1 }).limit(50);
  }

  async getObligations(companyId: string) {
    const ctx = requireCurrentTenant();
    return this.obligationModel
      .find({ tenantId: ctx.tenantId, companyId })
      .sort({ prazoEntrega: -1 })
      .limit(50);
  }
}
