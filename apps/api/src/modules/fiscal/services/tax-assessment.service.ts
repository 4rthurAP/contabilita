import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Decimal from 'decimal.js';
import { TaxAssessment, TaxAssessmentDocument } from '../schemas/tax-assessment.schema';
import { Invoice, InvoiceDocument } from '../schemas/invoice.schema';
import { requireCurrentTenant } from '../../tenant/tenant.context';
import { TipoImposto, StatusNotaFiscal, TipoNotaFiscal } from '@contabilita/shared';

@Injectable()
export class TaxAssessmentService {
  constructor(
    @InjectModel(TaxAssessment.name) private assessmentModel: Model<TaxAssessmentDocument>,
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
  ) {}

  /**
   * Recalcula a apuracao mensal de todos os impostos para a empresa.
   * Agrega valores das NFs escrituradas no periodo.
   */
  async recalculate(companyId: string, year: number, month: number) {
    const ctx = requireCurrentTenant();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Buscar todas as NFs escrituradas no periodo
    const invoices = await this.invoiceModel.find({
      tenantId: ctx.tenantId,
      companyId,
      status: StatusNotaFiscal.Escriturada,
      dataEmissao: { $gte: startDate, $lte: endDate },
    });

    // Acumular impostos por tipo
    const taxTotals = new Map<string, { debito: Decimal; credito: Decimal }>();

    for (const invoice of invoices) {
      const isSaida = invoice.tipo === TipoNotaFiscal.Saida;

      for (const item of invoice.items) {
        for (const imposto of item.impostos) {
          const valor = new Decimal(imposto.valor?.toString() || '0');
          if (valor.isZero()) continue;

          if (!taxTotals.has(imposto.tipo)) {
            taxTotals.set(imposto.tipo, { debito: new Decimal(0), credito: new Decimal(0) });
          }
          const entry = taxTotals.get(imposto.tipo)!;

          if (isSaida) {
            // Saida gera debito fiscal (imposto a pagar)
            entry.debito = entry.debito.plus(valor);
          } else {
            // Entrada gera credito fiscal (imposto a recuperar)
            entry.credito = entry.credito.plus(valor);
          }
        }
      }
    }

    // Upsert apuracoes para cada imposto
    const results = [];
    for (const [tipo, totals] of taxTotals.entries()) {
      const valorRecolher = Decimal.max(totals.debito.minus(totals.credito), new Decimal(0));

      const assessment = await this.assessmentModel.findOneAndUpdate(
        { tenantId: ctx.tenantId, companyId, year, month, tipo },
        {
          tenantId: ctx.tenantId,
          companyId,
          year,
          month,
          tipo,
          valorApurado: totals.debito.toString(),
          creditos: totals.credito.toString(),
          valorRecolher: valorRecolher.toString(),
        },
        { upsert: true, new: true },
      );
      results.push(assessment);
    }

    return results;
  }

  async findByPeriod(companyId: string, year: number, month: number) {
    const ctx = requireCurrentTenant();
    return this.assessmentModel.find({
      tenantId: ctx.tenantId,
      companyId,
      year,
      month,
    });
  }

  async findAll(companyId: string, year?: number) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, companyId };
    if (year) filter.year = year;

    return this.assessmentModel.find(filter).sort({ year: -1, month: -1 });
  }
}
