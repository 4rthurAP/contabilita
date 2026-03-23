import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Decimal from 'decimal.js';
import { requireCurrentTenant } from '../tenant/tenant.context';

interface CashFlowEntry {
  date: string;
  type: 'actual' | 'predicted';
  category: string;
  description: string;
  inflow: string;
  outflow: string;
  balance: string;
}

/**
 * Servico de predicao de fluxo de caixa.
 *
 * Combina:
 * 1. Dados reais: transacoes bancarias importadas
 * 2. Saidas programadas: guias fiscais, folha, honorarios
 * 3. Entradas programadas: cobrancas a receber
 * 4. Predicao: suavizacao exponencial do historico
 *
 * Alerta quando saldo projetado fica negativo.
 */
@Injectable()
export class CashFlowPredictionService {
  private readonly logger = new Logger(CashFlowPredictionService.name);

  constructor(
    @InjectModel('BankTransaction') private txModel: Model<any>,
    @InjectModel('TaxPayment') private paymentModel: Model<any>,
    @InjectModel('Cobranca') private cobrancaModel: Model<any>,
    @InjectModel('PayrollRun') private payrollModel: Model<any>,
  ) {}

  /**
   * Gera projecao de fluxo de caixa para os proximos N dias.
   */
  async predict(companyId: string, daysAhead = 90) {
    const ctx = requireCurrentTenant();
    const today = new Date();
    const futureDate = new Date(today.getTime() + daysAhead * 24 * 3600 * 1000);
    const pastDate = new Date(today.getTime() - 90 * 24 * 3600 * 1000);

    // 1. Saldo atual (soma de transacoes bancarias)
    const balanceResult = await this.txModel.aggregate([
      {
        $match: {
          tenantId: ctx.tenantId,
          companyId,
          status: { $ne: 'ignorada' },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDecimal: '$amount' } },
        },
      },
    ]);
    let currentBalance = new Decimal(balanceResult[0]?.total?.toString() || '0');

    // 2. Historico mensal (para predicao)
    const monthlyHistory = await this.txModel.aggregate([
      {
        $match: {
          tenantId: ctx.tenantId,
          companyId,
          date: { $gte: pastDate, $lte: today },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          totalInflow: {
            $sum: {
              $cond: [{ $gt: [{ $toDecimal: '$amount' }, 0] }, { $toDecimal: '$amount' }, 0],
            },
          },
          totalOutflow: {
            $sum: {
              $cond: [{ $lt: [{ $toDecimal: '$amount' }, 0] }, { $abs: { $toDecimal: '$amount' } }, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 3. Saidas programadas
    const scheduledOutflows: CashFlowEntry[] = [];

    // Guias fiscais pendentes
    const pendingPayments = await this.paymentModel.find({
      tenantId: ctx.tenantId,
      companyId,
      status: 'pendente',
      dataVencimento: { $gte: today, $lte: futureDate },
    }).sort({ dataVencimento: 1 });

    for (const p of pendingPayments) {
      scheduledOutflows.push({
        date: p.dataVencimento.toISOString().split('T')[0],
        type: 'predicted',
        category: 'impostos',
        description: `${p.tipoGuia} ${p.tipo} - ${p.competencia}`,
        inflow: '0',
        outflow: p.valorTotal?.toString() || '0',
        balance: '0',
      });
    }

    // 4. Entradas programadas (cobrancas pendentes)
    const scheduledInflows: CashFlowEntry[] = [];

    const pendingBillings = await this.cobrancaModel.find({
      tenantId: ctx.tenantId,
      companyId,
      status: 'pendente',
      dataVencimento: { $gte: today, $lte: futureDate },
    }).sort({ dataVencimento: 1 });

    for (const c of pendingBillings) {
      scheduledInflows.push({
        date: c.dataVencimento.toISOString().split('T')[0],
        type: 'predicted',
        category: 'honorarios',
        description: `Cobranca ${c.competencia}`,
        inflow: c.valorTotal?.toString() || '0',
        outflow: '0',
        balance: '0',
      });
    }

    // 5. Predicao por suavizacao exponencial
    const alpha = 0.3; // Fator de suavizacao
    const avgInflow = this.exponentialSmoothing(
      monthlyHistory.map((h) => parseFloat(h.totalInflow?.toString() || '0')),
      alpha,
    );
    const avgOutflow = this.exponentialSmoothing(
      monthlyHistory.map((h) => parseFloat(h.totalOutflow?.toString() || '0')),
      alpha,
    );

    // 6. Montar projecao dia a dia
    const entries: CashFlowEntry[] = [];
    let projectedBalance = currentBalance;
    const dailyInflow = new Decimal(avgInflow).dividedBy(30).toDecimalPlaces(2);
    const dailyOutflow = new Decimal(avgOutflow).dividedBy(30).toDecimalPlaces(2);

    let alertDate: string | null = null;

    for (let d = 0; d <= daysAhead; d++) {
      const date = new Date(today.getTime() + d * 24 * 3600 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      // Somar saidas e entradas programadas para este dia
      const dayOutflows = scheduledOutflows.filter((e) => e.date === dateStr);
      const dayInflows = scheduledInflows.filter((e) => e.date === dateStr);

      let dayTotalOut = dailyOutflow;
      let dayTotalIn = dailyInflow;

      for (const out of dayOutflows) {
        dayTotalOut = dayTotalOut.plus(new Decimal(out.outflow));
        entries.push(out);
      }
      for (const inf of dayInflows) {
        dayTotalIn = dayTotalIn.plus(new Decimal(inf.inflow));
        entries.push(inf);
      }

      projectedBalance = projectedBalance.plus(dayTotalIn).minus(dayTotalOut);

      // Alertar quando saldo projetado ficar negativo
      if (projectedBalance.isNegative() && !alertDate) {
        alertDate = dateStr;
      }
    }

    return {
      currentBalance: currentBalance.toFixed(2),
      projectedBalance: projectedBalance.toFixed(2),
      daysAhead,
      prediction: {
        avgMonthlyInflow: new Decimal(avgInflow).toFixed(2),
        avgMonthlyOutflow: new Decimal(avgOutflow).toFixed(2),
        netMonthly: new Decimal(avgInflow).minus(new Decimal(avgOutflow)).toFixed(2),
      },
      scheduledOutflows: scheduledOutflows.length,
      scheduledInflows: scheduledInflows.length,
      alert: alertDate
        ? {
            type: 'negative_balance',
            date: alertDate,
            message: `Saldo projetado ficara negativo em ${alertDate}. Revise entradas e saidas programadas.`,
          }
        : null,
    };
  }

  /**
   * Suavizacao exponencial simples para predicao.
   */
  private exponentialSmoothing(data: number[], alpha: number): number {
    if (data.length === 0) return 0;
    let forecast = data[0];
    for (let i = 1; i < data.length; i++) {
      forecast = alpha * data[i] + (1 - alpha) * forecast;
    }
    return forecast;
  }
}
