import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Decimal from 'decimal.js';
import { CctService } from './cct.service';
import { requireCurrentTenant } from '../tenant/tenant.context';

/**
 * Servico de planejamento tributario automatico.
 *
 * Puxa dados reais de 12 meses (receitas, despesas, folha) e simula
 * a carga tributaria sob cada regime (Simples Nacional, Lucro Presumido,
 * Lucro Real), indicando qual gera menor imposto.
 *
 * Diferente do CctService (que recebe inputs manuais), este usa dados reais.
 */
@Injectable()
export class TaxPlanningService {
  private readonly logger = new Logger(TaxPlanningService.name);

  constructor(
    @InjectModel('Invoice') private invoiceModel: Model<any>,
    @InjectModel('JournalEntry') private entryModel: Model<any>,
    @InjectModel('PayrollRun') private payrollModel: Model<any>,
    private readonly cctService: CctService,
  ) {}

  /**
   * Gera analise de planejamento tributario com dados reais de 12 meses.
   */
  async analyze(companyId: string, year: number) {
    const ctx = requireCurrentTenant();

    // Coletar dados reais dos 12 meses
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Receita bruta (NFs de saida)
    const receitas = await this.invoiceModel.aggregate([
      {
        $match: {
          tenantId: ctx.tenantId,
          companyId,
          tipo: 'saida',
          status: 'escriturada',
          dataEmissao: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $month: '$dataEmissao' },
          total: { $sum: { $toDecimal: '$totalNota' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    // Despesas (NFs de entrada)
    const despesas = await this.invoiceModel.aggregate([
      {
        $match: {
          tenantId: ctx.tenantId,
          companyId,
          tipo: 'entrada',
          status: 'escriturada',
          dataEmissao: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $month: '$dataEmissao' },
          total: { $sum: { $toDecimal: '$totalNota' } },
        },
      },
    ]);

    // Folha de pagamento
    const folha = await this.payrollModel.aggregate([
      {
        $match: {
          tenantId: ctx.tenantId,
          companyId,
          status: { $in: ['calculada', 'aprovada', 'fechada'] },
          ano: year,
        },
      },
      {
        $group: {
          _id: '$mes',
          totalBruto: { $sum: { $toDecimal: '$totalBruto' } },
        },
      },
    ]);

    // Consolidar por mes
    const monthly: Array<{
      mes: number;
      receita: string;
      despesa: string;
      folha: string;
    }> = [];

    let receitaTotal = new Decimal(0);
    let despesaTotal = new Decimal(0);
    let folhaTotal = new Decimal(0);

    for (let m = 1; m <= 12; m++) {
      const rec = receitas.find((r) => r._id === m);
      const desp = despesas.find((d) => d._id === m);
      const fol = folha.find((f) => f._id === m);

      const recVal = new Decimal(rec?.total?.toString() || '0');
      const despVal = new Decimal(desp?.total?.toString() || '0');
      const folVal = new Decimal(fol?.totalBruto?.toString() || '0');

      receitaTotal = receitaTotal.plus(recVal);
      despesaTotal = despesaTotal.plus(despVal);
      folhaTotal = folhaTotal.plus(folVal);

      monthly.push({
        mes: m,
        receita: recVal.toFixed(2),
        despesa: despVal.toFixed(2),
        folha: folVal.toFixed(2),
      });
    }

    // Simular cada regime
    const simulations = this.simulateRegimes(receitaTotal, despesaTotal, folhaTotal);

    // Identificar melhor regime
    const bestRegime = simulations.reduce((best, curr) =>
      new Decimal(curr.totalImpostos).lt(new Decimal(best.totalImpostos)) ? curr : best,
    );

    const economiaMaxima = new Decimal(
      simulations.reduce((max, s) =>
        new Decimal(s.totalImpostos).gt(new Decimal(max.totalImpostos)) ? s : max,
      ).totalImpostos,
    ).minus(new Decimal(bestRegime.totalImpostos));

    return {
      year,
      resumo: {
        receitaAnual: receitaTotal.toFixed(2),
        despesaAnual: despesaTotal.toFixed(2),
        folhaAnual: folhaTotal.toFixed(2),
        lucro: receitaTotal.minus(despesaTotal).minus(folhaTotal).toFixed(2),
      },
      monthly,
      simulations,
      recomendacao: {
        regimeIdeal: bestRegime.regime,
        economiaAnual: economiaMaxima.toFixed(2),
        justificativa: this.getJustificativa(bestRegime.regime, receitaTotal, despesaTotal),
      },
    };
  }

  private simulateRegimes(
    receita: Decimal,
    despesa: Decimal,
    folha: Decimal,
  ): Array<{ regime: string; totalImpostos: string; detalhamento: any }> {
    const results = [];

    // Simples Nacional (se receita <= 4.8M)
    if (receita.lte(new Decimal('4800000'))) {
      const aliquotaEfetiva = this.getSimplesTax(receita);
      const imposto = receita.times(aliquotaEfetiva).toDecimalPlaces(2);
      results.push({
        regime: 'Simples Nacional',
        totalImpostos: imposto.toFixed(2),
        detalhamento: {
          aliquotaEfetiva: aliquotaEfetiva.times(100).toFixed(2) + '%',
          das: imposto.toFixed(2),
        },
      });
    }

    // Lucro Presumido
    const presumidoBase = receita.times('0.32'); // Servicos 32%
    const irpj = presumidoBase.times('0.15').toDecimalPlaces(2);
    const irpjAdicional = Decimal.max(presumidoBase.minus(new Decimal('240000')), new Decimal(0)).times('0.10').toDecimalPlaces(2);
    const csll = presumidoBase.times('0.09').toDecimalPlaces(2);
    const pis = receita.times('0.0065').toDecimalPlaces(2);
    const cofins = receita.times('0.03').toDecimalPlaces(2);
    const totalPresumido = irpj.plus(irpjAdicional).plus(csll).plus(pis).plus(cofins);

    results.push({
      regime: 'Lucro Presumido',
      totalImpostos: totalPresumido.toFixed(2),
      detalhamento: {
        basePresumida: presumidoBase.toFixed(2),
        irpj: irpj.toFixed(2),
        irpjAdicional: irpjAdicional.toFixed(2),
        csll: csll.toFixed(2),
        pis: pis.toFixed(2),
        cofins: cofins.toFixed(2),
      },
    });

    // Lucro Real
    const lucroReal = receita.minus(despesa).minus(folha);
    const lucroTributavel = Decimal.max(lucroReal, new Decimal(0));
    const irpjReal = lucroTributavel.times('0.15').toDecimalPlaces(2);
    const irpjAdicReal = Decimal.max(lucroTributavel.minus(new Decimal('240000')), new Decimal(0)).times('0.10').toDecimalPlaces(2);
    const csllReal = lucroTributavel.times('0.09').toDecimalPlaces(2);
    const pisReal = receita.times('0.0165').toDecimalPlaces(2);
    const cofinsReal = receita.times('0.076').toDecimalPlaces(2);
    const creditoPisCofins = despesa.times('0.0925').toDecimalPlaces(2); // Creditos PIS/COFINS
    const totalReal = irpjReal.plus(irpjAdicReal).plus(csllReal)
      .plus(pisReal).plus(cofinsReal).minus(creditoPisCofins);

    results.push({
      regime: 'Lucro Real',
      totalImpostos: Decimal.max(totalReal, new Decimal(0)).toFixed(2),
      detalhamento: {
        lucroContabil: lucroReal.toFixed(2),
        irpj: irpjReal.toFixed(2),
        irpjAdicional: irpjAdicReal.toFixed(2),
        csll: csllReal.toFixed(2),
        pis: pisReal.toFixed(2),
        cofins: cofinsReal.toFixed(2),
        creditoPisCofins: creditoPisCofins.toFixed(2),
      },
    });

    return results;
  }

  private getSimplesTax(receita: Decimal): Decimal {
    // Anexo III simplificado (servicos)
    if (receita.lte(180000)) return new Decimal('0.06');
    if (receita.lte(360000)) return new Decimal('0.112');
    if (receita.lte(720000)) return new Decimal('0.135');
    if (receita.lte(1800000)) return new Decimal('0.16');
    if (receita.lte(3600000)) return new Decimal('0.21');
    return new Decimal('0.33');
  }

  private getJustificativa(regime: string, receita: Decimal, despesa: Decimal): string {
    if (regime === 'Simples Nacional') {
      return 'Simples Nacional e mais vantajoso para este faturamento. A aliquota efetiva unificada e menor que a soma dos tributos separados.';
    }
    if (regime === 'Lucro Real') {
      const margem = receita.isZero() ? new Decimal(0) : receita.minus(despesa).dividedBy(receita);
      return `Lucro Real e mais vantajoso porque a margem de lucro (${margem.times(100).toFixed(1)}%) e baixa, permitindo deducao integral das despesas e creditos de PIS/COFINS.`;
    }
    return 'Lucro Presumido e adequado para empresas com margem de lucro acima de 32% e poucas despesas dedutiveis.';
  }
}
