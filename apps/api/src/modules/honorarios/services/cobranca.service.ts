import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Decimal from 'decimal.js';
import { StatusCobranca, StatusContrato, FormaPagamento } from '@contabilita/shared';
import { Cobranca, CobrancaDocument } from '../schemas/cobranca.schema';
import { Contrato, ContratoDocument } from '../schemas/contrato.schema';
import { requireCurrentTenant } from '../../tenant/tenant.context';

@Injectable()
export class CobrancaService {
  constructor(
    @InjectModel(Cobranca.name) private cobrancaModel: Model<CobrancaDocument>,
    @InjectModel(Contrato.name) private contratoModel: Model<ContratoDocument>,
  ) {}

  async findAll(companyId: string, status?: string, competencia?: string) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, companyId };
    if (status) filter.status = status;
    if (competencia) filter.competencia = competencia;
    return this.cobrancaModel.find(filter).sort({ dataVencimento: -1 });
  }

  async markAsPaid(companyId: string, id: string, formaPagamento: FormaPagamento) {
    const ctx = requireCurrentTenant();
    const cobranca = await this.cobrancaModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!cobranca) throw new NotFoundException('Cobranca nao encontrada');

    cobranca.status = StatusCobranca.Paga;
    cobranca.dataPagamento = new Date();
    cobranca.formaPagamento = formaPagamento;
    return cobranca.save();
  }

  /**
   * Retorna fluxo de caixa mensal de honorarios para o ano.
   * orcado = soma do valorMensal de contratos ativos
   * realizado = soma do valorTotal das cobrancas pagas
   */
  async getCashFlow(companyId: string, year: number) {
    const ctx = requireCurrentTenant();
    const months = [];

    for (let month = 1; month <= 12; month++) {
      const competencia = `${year}/${String(month).padStart(2, '0')}`;

      // Orcado: soma dos contratos ativos no periodo
      const contratos = await this.contratoModel.find({
        tenantId: ctx.tenantId,
        companyId,
        status: StatusContrato.Ativo,
        dataInicio: { $lte: new Date(year, month - 1, 28) },
        $or: [
          { dataFim: null },
          { dataFim: { $exists: false } },
          { dataFim: { $gte: new Date(year, month - 1, 1) } },
        ],
      });

      let orcado = new Decimal(0);
      for (const contrato of contratos) {
        orcado = orcado.plus(new Decimal(contrato.valorMensal.toString()));
      }

      // Realizado: soma das cobrancas pagas na competencia
      const cobrancasPagas = await this.cobrancaModel.find({
        tenantId: ctx.tenantId,
        companyId,
        competencia,
        status: StatusCobranca.Paga,
      });

      let realizado = new Decimal(0);
      for (const cobranca of cobrancasPagas) {
        realizado = realizado.plus(new Decimal(cobranca.valorTotal.toString()));
      }

      months.push({
        mes: month,
        competencia,
        orcado: orcado.toString(),
        realizado: realizado.toString(),
      });
    }

    return { year, months };
  }
}
