import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Decimal from 'decimal.js';
import { TaxPayment, TaxPaymentDocument } from '../schemas/tax-payment.schema';
import { TaxAssessment, TaxAssessmentDocument } from '../schemas/tax-assessment.schema';
import { requireCurrentTenant } from '../../tenant/tenant.context';
import { TipoImposto, StatusGuia } from '@contabilita/shared';

// Mapeamento de imposto para codigo de receita DARF
const CODIGOS_RECEITA: Partial<Record<TipoImposto, string>> = {
  [TipoImposto.IRPJ]: '2372',
  [TipoImposto.CSLL]: '2484',
  [TipoImposto.PIS]: '8109',
  [TipoImposto.COFINS]: '2172',
  [TipoImposto.IRRF]: '0561',
};

@Injectable()
export class TaxPaymentService {
  constructor(
    @InjectModel(TaxPayment.name) private paymentModel: Model<TaxPaymentDocument>,
    @InjectModel(TaxAssessment.name) private assessmentModel: Model<TaxAssessmentDocument>,
  ) {}

  /**
   * Gera guias de pagamento a partir das apuracoes mensais.
   */
  async generateFromAssessment(companyId: string, year: number, month: number) {
    const ctx = requireCurrentTenant();

    const assessments = await this.assessmentModel.find({
      tenantId: ctx.tenantId,
      companyId,
      year,
      month,
    });

    const payments = [];

    for (const assessment of assessments) {
      const valor = new Decimal(assessment.valorRecolher?.toString() || '0');
      if (valor.isZero() || valor.isNegative()) continue;

      // Determinar tipo de guia e vencimento
      const tipo = assessment.tipo as TipoImposto;
      let tipoGuia: string;
      let dataVencimento: Date;

      if (tipo === TipoImposto.ICMS) {
        tipoGuia = 'DARE'; // Guia estadual
        dataVencimento = new Date(year, month, 15); // Dia 15 do mes seguinte
      } else if (tipo === TipoImposto.ISS) {
        tipoGuia = 'ISS'; // Guia municipal
        dataVencimento = new Date(year, month, 10);
      } else {
        tipoGuia = 'DARF'; // Guia federal
        dataVencimento = new Date(year, month, 20); // Dia 20 do mes seguinte
      }

      // Verificar se ja existe guia
      const existing = await this.paymentModel.findOne({
        tenantId: ctx.tenantId,
        companyId,
        assessmentId: assessment._id,
      });
      if (existing) continue;

      const payment = await this.paymentModel.create({
        tenantId: ctx.tenantId,
        companyId,
        assessmentId: assessment._id,
        tipo,
        tipoGuia,
        competencia: `${String(month).padStart(2, '0')}/${year}`,
        dataVencimento,
        valorPrincipal: valor.toString(),
        valorTotal: valor.toString(),
        codigoReceita: CODIGOS_RECEITA[tipo] || '',
        status: StatusGuia.Pendente,
      });
      payments.push(payment);
    }

    return payments;
  }

  async findAll(companyId: string, status?: string) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, companyId };
    if (status) filter.status = status;

    return this.paymentModel.find(filter).sort({ dataVencimento: -1 });
  }

  async markAsPaid(companyId: string, id: string, dataPagamento: Date) {
    const ctx = requireCurrentTenant();
    const payment = await this.paymentModel.findOne({
      _id: id,
      tenantId: ctx.tenantId,
      companyId,
    });
    if (!payment) throw new NotFoundException('Guia nao encontrada');

    payment.status = StatusGuia.Paga;
    payment.dataPagamento = dataPagamento;
    return payment.save();
  }
}
