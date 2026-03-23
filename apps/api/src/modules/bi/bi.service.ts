import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Decimal from 'decimal.js';
import { WidgetDefinition, WidgetDefinitionDocument, WidgetDataSource } from './schemas/widget-definition.schema';
import { requireCurrentTenant } from '../tenant/tenant.context';

/**
 * Servico de Business Intelligence.
 *
 * Executa aggregation pipelines no MongoDB para cada tipo de widget,
 * retornando dados formatados para visualizacao no frontend.
 *
 * Suporta analise cross-company (portfolio) para partners/owners.
 */
@Injectable()
export class BiService {
  private readonly logger = new Logger(BiService.name);

  constructor(
    @InjectModel(WidgetDefinition.name) private widgetModel: Model<WidgetDefinitionDocument>,
    @InjectModel('Invoice') private invoiceModel: Model<any>,
    @InjectModel('TaxPayment') private paymentModel: Model<any>,
    @InjectModel('Obligation') private obligationModel: Model<any>,
    @InjectModel('BankTransaction') private txModel: Model<any>,
    @InjectModel('Company') private companyModel: Model<any>,
  ) {}

  async getWidgets(dashboardId?: string) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId };
    if (dashboardId) filter.dashboardId = dashboardId;
    return this.widgetModel.find(filter).sort({ 'layout.y': 1, 'layout.x': 1 });
  }

  async createWidget(data: Partial<WidgetDefinition>) {
    const ctx = requireCurrentTenant();
    return this.widgetModel.create({ ...data, tenantId: ctx.tenantId, createdBy: ctx.userId });
  }

  async updateWidget(id: string, data: Partial<WidgetDefinition>) {
    const ctx = requireCurrentTenant();
    return this.widgetModel.findOneAndUpdate({ _id: id, tenantId: ctx.tenantId }, data, { new: true });
  }

  async deleteWidget(id: string) {
    const ctx = requireCurrentTenant();
    return this.widgetModel.deleteOne({ _id: id, tenantId: ctx.tenantId });
  }

  /**
   * Executa a query de dados para um widget especifico.
   */
  async getWidgetData(widgetId: string) {
    const ctx = requireCurrentTenant();
    const widget = await this.widgetModel.findOne({ _id: widgetId, tenantId: ctx.tenantId });
    if (!widget) return null;

    return this.fetchDataForSource(ctx.tenantId, widget.dataSource, widget.config);
  }

  async fetchDataForSource(tenantId: string, source: WidgetDataSource, config?: any) {
    switch (source) {
      case WidgetDataSource.RevenueByCompany:
        return this.getRevenueByCompany(tenantId, config);
      case WidgetDataSource.ComplianceRate:
        return this.getComplianceRate(tenantId, config);
      case WidgetDataSource.ReconciliationRate:
        return this.getReconciliationRate(tenantId, config);
      case WidgetDataSource.ReceivablesAging:
        return this.getReceivablesAging(tenantId, config);
      default:
        return { message: `DataSource ${source} — use DashboardService for standard widgets` };
    }
  }

  /** Receita por empresa (portfolio view) */
  private async getRevenueByCompany(tenantId: string, config?: any) {
    const year = new Date().getFullYear();
    const result = await this.invoiceModel.aggregate([
      {
        $match: {
          tenantId,
          tipo: 'saida',
          status: 'escriturada',
          dataEmissao: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31) },
        },
      },
      {
        $group: {
          _id: '$companyId',
          receita: { $sum: { $toDecimal: '$totalNota' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { receita: -1 } },
      { $limit: 20 },
    ]);

    // Enriquecer com nomes das empresas
    const companyIds = result.map((r) => r._id);
    const companies = await this.companyModel.find({ _id: { $in: companyIds } }).select('razaoSocial');
    const companyMap = new Map(companies.map((c) => [c._id.toString(), c.razaoSocial]));

    return result.map((r) => ({
      company: companyMap.get(r._id.toString()) || 'N/A',
      receita: r.receita?.toString() || '0',
      notasEmitidas: r.count,
    }));
  }

  /** Taxa de cumprimento de obrigacoes acessorias */
  private async getComplianceRate(tenantId: string, config?: any) {
    const [total, transmitted] = await Promise.all([
      this.obligationModel.countDocuments({ tenantId }),
      this.obligationModel.countDocuments({ tenantId, status: 'transmitida' }),
    ]);

    const rate = total > 0 ? (transmitted / total * 100) : 0;
    return { total, transmitted, pending: total - transmitted, rate: rate.toFixed(1) };
  }

  /** Taxa de conciliacao bancaria */
  private async getReconciliationRate(tenantId: string, config?: any) {
    const [total, reconciled] = await Promise.all([
      this.txModel.countDocuments({ tenantId }),
      this.txModel.countDocuments({ tenantId, status: 'conciliada' }),
    ]);

    const rate = total > 0 ? (reconciled / total * 100) : 0;
    return { total, reconciled, pending: total - reconciled, rate: rate.toFixed(1) };
  }

  /** Aging de contas a receber (honorarios) */
  private async getReceivablesAging(tenantId: string, config?: any) {
    const today = new Date();
    const { InjectModel } = require('@nestjs/mongoose');

    // Simplificado — em producao, usar Cobranca model
    const result = await this.paymentModel.aggregate([
      { $match: { tenantId, status: 'pendente' } },
      {
        $addFields: {
          diasVencido: {
            $dateDiff: { startDate: '$dataVencimento', endDate: today, unit: 'day' },
          },
        },
      },
      {
        $bucket: {
          groupBy: '$diasVencido',
          boundaries: [-9999, 0, 30, 60, 90, 180, 9999],
          default: 'outros',
          output: {
            count: { $sum: 1 },
            total: { $sum: { $toDecimal: '$valorTotal' } },
          },
        },
      },
    ]);

    return result.map((r) => ({
      faixa: this.agingLabel(r._id),
      quantidade: r.count,
      valor: r.total?.toString() || '0',
    }));
  }

  private agingLabel(boundary: any): string {
    if (boundary === -9999) return 'A vencer';
    if (boundary === 0) return '0-30 dias';
    if (boundary === 30) return '31-60 dias';
    if (boundary === 60) return '61-90 dias';
    if (boundary === 90) return '91-180 dias';
    if (boundary === 180) return '180+ dias';
    return 'Outros';
  }
}
