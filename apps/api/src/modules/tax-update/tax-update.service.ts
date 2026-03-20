import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Decimal from 'decimal.js';
import dayjs from 'dayjs';
import { TaxPayment, TaxPaymentDocument } from '../fiscal/schemas/tax-payment.schema';
import { requireCurrentTenant } from '../tenant/tenant.context';

/**
 * Taxas SELIC mensais simplificadas (2024).
 * Em producao, estas seriam buscadas via API do Banco Central.
 */
const SELIC_MENSAL: Record<string, number> = {
  '2024-01': 0.0097, '2024-02': 0.0080, '2024-03': 0.0083,
  '2024-04': 0.0089, '2024-05': 0.0083, '2024-06': 0.0079,
  '2024-07': 0.0091, '2024-08': 0.0087, '2024-09': 0.0084,
  '2024-10': 0.0093, '2024-11': 0.0079, '2024-12': 0.0093,
  '2025-01': 0.0106, '2025-02': 0.0100, '2025-03': 0.0106,
};

@Injectable()
export class TaxUpdateService {
  constructor(
    @InjectModel(TaxPayment.name) private paymentModel: Model<TaxPaymentDocument>,
  ) {}

  /**
   * Lista impostos vencidos e calcula multa + juros SELIC.
   */
  async getOverdueTaxes(companyId: string) {
    const ctx = requireCurrentTenant();
    const today = new Date();

    const overdue = await this.paymentModel.find({
      tenantId: ctx.tenantId,
      companyId,
      status: 'pendente',
      dataVencimento: { $lt: today },
    }).sort({ dataVencimento: 1 });

    return overdue.map((payment) => {
      const principal = new Decimal(payment.valorPrincipal?.toString() || '0');
      const vencimento = dayjs(payment.dataVencimento);
      const diasAtraso = dayjs().diff(vencimento, 'day');

      const { multa, juros, totalAtualizado } = this.calcularAtualizacao(
        principal,
        payment.dataVencimento,
        today,
        payment.tipoGuia,
      );

      return {
        _id: payment._id,
        tipo: payment.tipo,
        tipoGuia: payment.tipoGuia,
        competencia: payment.competencia,
        dataVencimento: payment.dataVencimento,
        diasAtraso,
        valorPrincipal: principal.toString(),
        multa: multa.toString(),
        juros: juros.toString(),
        totalAtualizado: totalAtualizado.toString(),
        codigoReceita: payment.codigoReceita,
      };
    });
  }

  /**
   * Calcula multa + juros para um imposto especifico.
   */
  async calculateUpdate(companyId: string, paymentId: string, dataCalculo?: string) {
    const ctx = requireCurrentTenant();
    const payment = await this.paymentModel.findOne({
      _id: paymentId,
      tenantId: ctx.tenantId,
      companyId,
    });
    if (!payment) throw new NotFoundException('Guia nao encontrada');

    const principal = new Decimal(payment.valorPrincipal?.toString() || '0');
    const dataRef = dataCalculo ? new Date(dataCalculo) : new Date();

    return this.calcularAtualizacao(principal, payment.dataVencimento, dataRef, payment.tipoGuia);
  }

  /**
   * Calculo de multa e juros para DARF:
   * - Multa: 0.33% por dia de atraso, maximo 20%
   * - Juros: SELIC acumulada do mes seguinte ao vencimento ate o mes do pagamento + 1%
   */
  private calcularAtualizacao(
    principal: Decimal,
    dataVencimento: Date,
    dataCalculo: Date,
    tipoGuia: string,
  ) {
    const vencimento = dayjs(dataVencimento);
    const calculo = dayjs(dataCalculo);

    if (calculo.isBefore(vencimento) || calculo.isSame(vencimento)) {
      return {
        multa: new Decimal(0),
        juros: new Decimal(0),
        totalAtualizado: principal,
        detalhamento: { diasAtraso: 0, percentualMulta: '0', percentualJuros: '0' },
      };
    }

    const diasAtraso = calculo.diff(vencimento, 'day');

    // Multa: 0.33% por dia, max 20%
    const percentualMulta = Math.min(diasAtraso * 0.0033, 0.20);
    const multa = principal.times(percentualMulta).toDecimalPlaces(2);

    // Juros: SELIC acumulada + 1% do mes de pagamento
    let percentualJuros = new Decimal(0);
    let mesRef = vencimento.add(1, 'month').startOf('month');

    while (mesRef.isBefore(calculo.startOf('month')) || mesRef.isSame(calculo.startOf('month'))) {
      const key = mesRef.format('YYYY-MM');
      const taxa = SELIC_MENSAL[key] || 0.01; // Fallback 1% se nao tiver a taxa
      percentualJuros = percentualJuros.plus(taxa);
      mesRef = mesRef.add(1, 'month');
    }

    // Adicionar 1% referente ao mes do pagamento
    percentualJuros = percentualJuros.plus(0.01);

    const juros = principal.times(percentualJuros).toDecimalPlaces(2);
    const totalAtualizado = principal.plus(multa).plus(juros);

    return {
      multa,
      juros,
      totalAtualizado,
      detalhamento: {
        diasAtraso,
        percentualMulta: (percentualMulta * 100).toFixed(2) + '%',
        percentualJuros: percentualJuros.times(100).toFixed(2) + '%',
      },
    };
  }
}
