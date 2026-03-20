import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Decimal from 'decimal.js';
import { JournalEntry, JournalEntryDocument } from '../accounting/schemas/journal-entry.schema';
import { Account, AccountDocument } from '../accounting/schemas/account.schema';
import { requireCurrentTenant } from '../tenant/tenant.context';
import { TipoConta, NaturezaConta } from '@contabilita/shared';

export interface AccountBalance {
  accountId: string;
  codigo: string;
  nome: string;
  tipo: TipoConta;
  natureza: NaturezaConta;
  nivel: number;
  saldo: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(JournalEntry.name) private entryModel: Model<JournalEntryDocument>,
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
  ) {}

  /**
   * Balanco Patrimonial - Ativo = Passivo + PL
   */
  async getBalancoPatrimonial(companyId: string, endDate: string) {
    const balances = await this.getAccountBalances(companyId, endDate);

    const ativo = balances.filter((b) => b.tipo === TipoConta.Ativo);
    const passivo = balances.filter((b) => b.tipo === TipoConta.Passivo);
    const pl = balances.filter((b) => b.tipo === TipoConta.PatrimonioLiquido);

    const totalAtivo = ativo.reduce((s, a) => s.plus(a.saldo), new Decimal(0));
    const totalPassivo = passivo.reduce((s, a) => s.plus(a.saldo), new Decimal(0));
    const totalPl = pl.reduce((s, a) => s.plus(a.saldo), new Decimal(0));

    return {
      date: endDate,
      ativo: { accounts: ativo, total: totalAtivo.toString() },
      passivo: { accounts: passivo, total: totalPassivo.toString() },
      patrimonioLiquido: { accounts: pl, total: totalPl.toString() },
      balanced: totalAtivo.equals(totalPassivo.plus(totalPl)),
    };
  }

  /**
   * DRE - Demonstracao do Resultado do Exercicio
   */
  async getDRE(companyId: string, startDate: string, endDate: string) {
    const balances = await this.getAccountBalancesByPeriod(companyId, startDate, endDate);

    const receitas = balances.filter((b) => b.tipo === TipoConta.Receita);
    const despesas = balances.filter((b) => b.tipo === TipoConta.Despesa);
    const custos = balances.filter((b) => b.tipo === TipoConta.CustoProducao);

    const totalReceitas = receitas.reduce((s, a) => s.plus(a.saldo), new Decimal(0));
    const totalDespesas = despesas.reduce((s, a) => s.plus(a.saldo), new Decimal(0));
    const totalCustos = custos.reduce((s, a) => s.plus(a.saldo), new Decimal(0));

    const receitaLiquida = totalReceitas;
    const lucroBruto = receitaLiquida.minus(totalCustos);
    const resultadoOperacional = lucroBruto.minus(totalDespesas);

    return {
      startDate,
      endDate,
      receitas: { accounts: receitas, total: totalReceitas.toString() },
      custos: { accounts: custos, total: totalCustos.toString() },
      lucroBruto: lucroBruto.toString(),
      despesas: { accounts: despesas, total: totalDespesas.toString() },
      resultadoOperacional: resultadoOperacional.toString(),
      resultadoLiquido: resultadoOperacional.toString(),
    };
  }

  /**
   * Indicadores financeiros para dashboard
   */
  async getIndicadores(companyId: string, endDate: string) {
    const bp = await this.getBalancoPatrimonial(companyId, endDate);
    const startOfYear = endDate.substring(0, 4) + '-01-01';
    const dre = await this.getDRE(companyId, startOfYear, endDate);

    const totalAtivo = new Decimal(bp.ativo.total);
    const totalPassivo = new Decimal(bp.passivo.total);
    const totalPl = new Decimal(bp.patrimonioLiquido.total);
    const receitaTotal = new Decimal(dre.receitas.total);
    const resultado = new Decimal(dre.resultadoLiquido);

    // Indicadores de liquidez (simplificado - usa total do circulante)
    const liquidezGeral = totalPassivo.isZero()
      ? '0'
      : totalAtivo.dividedBy(totalPassivo).toDecimalPlaces(2).toString();

    // Rentabilidade
    const margemLiquida = receitaTotal.isZero()
      ? '0'
      : resultado.dividedBy(receitaTotal).times(100).toDecimalPlaces(2).toString();

    const roe = totalPl.isZero()
      ? '0'
      : resultado.dividedBy(totalPl).times(100).toDecimalPlaces(2).toString();

    // Endividamento
    const endividamentoGeral = totalAtivo.isZero()
      ? '0'
      : totalPassivo.dividedBy(totalAtivo).times(100).toDecimalPlaces(2).toString();

    return {
      date: endDate,
      liquidez: { geral: liquidezGeral },
      rentabilidade: { margemLiquida: margemLiquida + '%', roe: roe + '%' },
      endividamento: { geral: endividamentoGeral + '%' },
      patrimonio: {
        totalAtivo: totalAtivo.toString(),
        totalPassivo: totalPassivo.toString(),
        totalPl: totalPl.toString(),
      },
      resultado: {
        receita: receitaTotal.toString(),
        resultado: resultado.toString(),
      },
    };
  }

  /** Calcula saldos acumulados ate uma data (para Balanco) */
  private async getAccountBalances(companyId: string, endDate: string): Promise<AccountBalance[]> {
    const ctx = requireCurrentTenant();

    const results = await this.entryModel.aggregate([
      {
        $match: {
          tenantId: { $toObjectId: ctx.tenantId },
          companyId: { $toObjectId: companyId },
          date: { $lte: new Date(endDate) },
        },
      },
      { $unwind: '$lines' },
      {
        $group: {
          _id: '$lines.accountId',
          totalDebit: { $sum: { $toDecimal: '$lines.debit' } },
          totalCredit: { $sum: { $toDecimal: '$lines.credit' } },
        },
      },
      {
        $lookup: { from: 'accounts', localField: '_id', foreignField: '_id', as: 'account' },
      },
      { $unwind: '$account' },
      { $match: { 'account.isAnalytical': true } },
      {
        $project: {
          accountId: '$_id',
          codigo: '$account.codigo',
          nome: '$account.nome',
          tipo: '$account.tipo',
          natureza: '$account.natureza',
          nivel: '$account.nivel',
          totalDebit: { $toString: '$totalDebit' },
          totalCredit: { $toString: '$totalCredit' },
        },
      },
      { $sort: { codigo: 1 } },
    ]);

    return results.map((r) => {
      const d = new Decimal(r.totalDebit);
      const c = new Decimal(r.totalCredit);
      const saldo = r.natureza === NaturezaConta.Devedora ? d.minus(c) : c.minus(d);
      return { ...r, saldo: saldo.toString() };
    });
  }

  /** Calcula saldos de um periodo (para DRE) */
  private async getAccountBalancesByPeriod(companyId: string, startDate: string, endDate: string): Promise<AccountBalance[]> {
    const ctx = requireCurrentTenant();

    const results = await this.entryModel.aggregate([
      {
        $match: {
          tenantId: { $toObjectId: ctx.tenantId },
          companyId: { $toObjectId: companyId },
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      { $unwind: '$lines' },
      {
        $group: {
          _id: '$lines.accountId',
          totalDebit: { $sum: { $toDecimal: '$lines.debit' } },
          totalCredit: { $sum: { $toDecimal: '$lines.credit' } },
        },
      },
      {
        $lookup: { from: 'accounts', localField: '_id', foreignField: '_id', as: 'account' },
      },
      { $unwind: '$account' },
      { $match: { 'account.isAnalytical': true } },
      {
        $project: {
          accountId: '$_id',
          codigo: '$account.codigo',
          nome: '$account.nome',
          tipo: '$account.tipo',
          natureza: '$account.natureza',
          nivel: '$account.nivel',
          totalDebit: { $toString: '$totalDebit' },
          totalCredit: { $toString: '$totalCredit' },
        },
      },
      { $sort: { codigo: 1 } },
    ]);

    return results.map((r) => {
      const d = new Decimal(r.totalDebit);
      const c = new Decimal(r.totalCredit);
      const saldo = r.natureza === NaturezaConta.Devedora ? d.minus(c) : c.minus(d);
      return { ...r, saldo: saldo.toString() };
    });
  }
}
