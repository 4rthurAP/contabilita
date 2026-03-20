import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Decimal from 'decimal.js';
import { LalurEntry, LalurEntryDocument } from './schemas/lalur-entry.schema';
import { LalurBalance, LalurBalanceDocument } from './schemas/lalur-balance.schema';
import { CreateLalurEntryDto, CreateLalurBalanceDto } from './dto/create-lalur-entry.dto';
import { requireCurrentTenant } from '../tenant/tenant.context';

@Injectable()
export class LalurService {
  constructor(
    @InjectModel(LalurEntry.name) private entryModel: Model<LalurEntryDocument>,
    @InjectModel(LalurBalance.name) private balanceModel: Model<LalurBalanceDocument>,
  ) {}

  // ── Parte A ──
  async createEntry(companyId: string, dto: CreateLalurEntryDto) {
    const ctx = requireCurrentTenant();
    return this.entryModel.create({
      ...dto, tenantId: ctx.tenantId, companyId,
      createdBy: ctx.userId, updatedBy: ctx.userId,
    });
  }

  async getEntries(companyId: string, year: number, quarter?: number) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, companyId, year };
    if (quarter) filter.quarter = quarter;
    return this.entryModel.find(filter).sort({ quarter: 1 });
  }

  /** Calcula lucro real do periodo */
  async calculateLucroReal(companyId: string, year: number, quarter: number, lucroContabil: string) {
    const ctx = requireCurrentTenant();
    const entries = await this.entryModel.find({
      tenantId: ctx.tenantId, companyId, year, quarter,
    });

    let lucro = new Decimal(lucroContabil);
    let totalAdicoes = new Decimal(0);
    let totalExclusoes = new Decimal(0);

    for (const entry of entries) {
      const valor = new Decimal(entry.valor.toString());
      if (entry.tipo === 'adicao') {
        totalAdicoes = totalAdicoes.plus(valor);
        lucro = lucro.plus(valor);
      } else {
        totalExclusoes = totalExclusoes.plus(valor);
        lucro = lucro.minus(valor);
      }
    }

    // Compensacao de prejuizos (limitado a 30% do lucro ajustado positivo)
    let compensacao = new Decimal(0);
    if (lucro.isPositive()) {
      const prejuizos = await this.balanceModel.find({
        tenantId: ctx.tenantId, companyId, tipo: 'prejuizo_fiscal',
        saldoFinal: { $gt: '0' },
      });

      const limiteCompensacao = lucro.times('0.3');
      let disponivel = limiteCompensacao;

      for (const p of prejuizos) {
        const saldo = new Decimal(p.saldoFinal.toString());
        const usar = Decimal.min(saldo, disponivel);
        if (usar.isPositive()) {
          compensacao = compensacao.plus(usar);
          disponivel = disponivel.minus(usar);
        }
      }
      lucro = lucro.minus(compensacao);
    }

    return {
      lucroContabil: lucroContabil,
      totalAdicoes: totalAdicoes.toString(),
      totalExclusoes: totalExclusoes.toString(),
      compensacaoPrejuizos: compensacao.toString(),
      lucroReal: Decimal.max(lucro, new Decimal(0)).toString(),
      entries: entries.length,
    };
  }

  // ── Parte B ──
  async createBalance(companyId: string, dto: CreateLalurBalanceDto) {
    const ctx = requireCurrentTenant();
    return this.balanceModel.create({
      ...dto, tenantId: ctx.tenantId, companyId,
      saldoFinal: dto.saldoInicial,
    });
  }

  async getBalances(companyId: string, year: number) {
    const ctx = requireCurrentTenant();
    return this.balanceModel.find({ tenantId: ctx.tenantId, companyId, year });
  }
}
