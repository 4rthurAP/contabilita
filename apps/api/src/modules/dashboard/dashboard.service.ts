import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Decimal from 'decimal.js';
import { Company, CompanyDocument } from '../company/schemas/company.schema';
import { JournalEntry, JournalEntryDocument } from '../accounting/schemas/journal-entry.schema';
import { Employee, EmployeeDocument } from '../payroll/schemas/employee.schema';
import { BankTransaction, BankTransactionDocument } from '../bank-reconciliation/schemas/bank-transaction.schema';
import { Obligation, ObligationDocument } from '../obligations/schemas/obligation.schema';
import { TaxPayment, TaxPaymentDocument } from '../fiscal/schemas/tax-payment.schema';
import { TaxAssessment, TaxAssessmentDocument } from '../fiscal/schemas/tax-assessment.schema';
import { AuditLog, AuditLogDocument } from '../audit/schemas/audit-log.schema';
import { requireCurrentTenant } from '../tenant/tenant.context';
import { TipoConta, NaturezaConta } from '@contabilita/shared';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(JournalEntry.name) private entryModel: Model<JournalEntryDocument>,
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    @InjectModel(BankTransaction.name) private bankTxModel: Model<BankTransactionDocument>,
    @InjectModel(Obligation.name) private obligationModel: Model<ObligationDocument>,
    @InjectModel(TaxPayment.name) private paymentModel: Model<TaxPaymentDocument>,
    @InjectModel(TaxAssessment.name) private assessmentModel: Model<TaxAssessmentDocument>,
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
  ) {}

  /**
   * KPI cards para o dashboard principal.
   * Se companyId fornecido, filtra por empresa; senao, agrega todo o tenant.
   */
  async getSummary(companyId?: string) {
    const ctx = requireCurrentTenant();
    const tenantFilter: any = { tenantId: ctx.tenantId };
    const companyFilter: any = companyId
      ? { tenantId: ctx.tenantId, companyId: new Types.ObjectId(companyId) }
      : { tenantId: ctx.tenantId };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      companiesCount,
      entriesThisMonth,
      employeesCount,
      pendingReconciliation,
      pendingPaymentsAgg,
      upcomingObligations,
      overduePayments,
    ] = await Promise.all([
      this.companyModel.countDocuments({ ...tenantFilter, isActive: true }),
      this.entryModel.countDocuments({
        ...companyFilter,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      }),
      companyId
        ? this.employeeModel.countDocuments({ ...companyFilter, status: 'ativo' })
        : this.employeeModel.countDocuments({ ...tenantFilter, status: 'ativo' }),
      this.bankTxModel.countDocuments({ ...companyFilter, status: 'pendente' }),
      this.paymentModel.aggregate([
        { $match: { ...companyFilter, status: 'pendente' } },
        { $group: { _id: null, total: { $sum: { $toDecimal: '$valorTotal' } } } },
      ]),
      this.obligationModel.countDocuments({
        ...companyFilter,
        status: 'pendente',
        prazoEntrega: { $gte: now, $lte: in30Days },
      }),
      this.paymentModel.countDocuments({
        ...companyFilter,
        status: 'pendente',
        dataVencimento: { $lt: now },
      }),
    ]);

    const pendingPaymentsTotal =
      pendingPaymentsAgg.length > 0
        ? new Decimal(pendingPaymentsAgg[0].total.toString()).toDecimalPlaces(2).toString()
        : '0';

    return {
      companiesCount,
      entriesThisMonth,
      employeesCount,
      pendingReconciliation,
      pendingPaymentsTotal,
      upcomingObligations,
      overduePayments,
    };
  }

  /** Atividades recentes do tenant (audit log) */
  async getActivity(companyId?: string, limit = 10) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: new Types.ObjectId(ctx.tenantId) };
    if (companyId) filter.resource = { $ne: 'auth' }; // filtra login/logout quando vendo empresa

    return this.auditModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('action resource description userName createdAt')
      .lean();
  }

  /**
   * Tendencia DRE - receita, despesa e resultado para cada mes nos ultimos N meses.
   * Usa aggregation direto para performance (evita N chamadas ao ReportsService).
   */
  async getDreTrend(companyId: string, months = 12) {
    const ctx = requireCurrentTenant();
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const results = await this.entryModel.aggregate([
      {
        $match: {
          tenantId: new Types.ObjectId(ctx.tenantId),
          companyId: new Types.ObjectId(companyId),
          date: { $gte: startDate },
        },
      },
      { $unwind: '$lines' },
      {
        $lookup: {
          from: 'accounts',
          localField: 'lines.accountId',
          foreignField: '_id',
          as: 'account',
        },
      },
      { $unwind: '$account' },
      {
        $match: {
          'account.isAnalytical': true,
          'account.tipo': { $in: ['Receita', 'Despesa', 'CustoProducao'] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            tipo: '$account.tipo',
            natureza: '$account.natureza',
          },
          totalDebit: { $sum: { $toDecimal: '$lines.debit' } },
          totalCredit: { $sum: { $toDecimal: '$lines.credit' } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Agrupa por mes
    const monthMap = new Map<string, { receita: Decimal; despesa: Decimal; custo: Decimal }>();

    for (const r of results) {
      const key = `${r._id.year}-${String(r._id.month).padStart(2, '0')}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, { receita: new Decimal(0), despesa: new Decimal(0), custo: new Decimal(0) });
      }
      const m = monthMap.get(key)!;
      const d = new Decimal(r.totalDebit.toString());
      const c = new Decimal(r.totalCredit.toString());
      const saldo = r._id.natureza === NaturezaConta.Devedora ? d.minus(c) : c.minus(d);

      if (r._id.tipo === TipoConta.Receita) m.receita = m.receita.plus(saldo);
      else if (r._id.tipo === TipoConta.Despesa) m.despesa = m.despesa.plus(saldo);
      else if (r._id.tipo === TipoConta.CustoProducao) m.custo = m.custo.plus(saldo);
    }

    return Array.from(monthMap.entries()).map(([month, v]) => ({
      month,
      receita: v.receita.toDecimalPlaces(2).toString(),
      despesa: v.despesa.plus(v.custo).toDecimalPlaces(2).toString(),
      resultado: v.receita.minus(v.despesa).minus(v.custo).toDecimalPlaces(2).toString(),
    }));
  }

  /**
   * Carga tributaria por tipo de imposto no ano.
   */
  async getTaxBurden(companyId: string, year?: number) {
    const ctx = requireCurrentTenant();
    const targetYear = year ?? new Date().getFullYear();

    const results = await this.assessmentModel.aggregate([
      {
        $match: {
          tenantId: new Types.ObjectId(ctx.tenantId),
          companyId: new Types.ObjectId(companyId),
          year: targetYear,
        },
      },
      {
        $group: {
          _id: '$tipo',
          totalRecolher: { $sum: { $toDecimal: '$valorRecolher' } },
          totalApurado: { $sum: { $toDecimal: '$valorApurado' } },
        },
      },
      { $sort: { totalRecolher: -1 } },
    ]);

    return results.map((r) => ({
      tipo: r._id,
      totalRecolher: new Decimal(r.totalRecolher.toString()).toDecimalPlaces(2).toString(),
      totalApurado: new Decimal(r.totalApurado.toString()).toDecimalPlaces(2).toString(),
    }));
  }
}
