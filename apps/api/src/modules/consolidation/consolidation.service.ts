import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Decimal from 'decimal.js';
import { CompanyGroup, CompanyGroupDocument } from './schemas/company-group.schema';
import { requireCurrentTenant } from '../tenant/tenant.context';

/**
 * Servico de consolidacao de demonstracoes financeiras multi-empresa.
 *
 * Gera Balanco Patrimonial e DRE consolidados para grupos economicos,
 * com eliminacao automatica de transacoes intercompany.
 *
 * Conforme CPC 36 (IFRS 10) — Demonstracoes Consolidadas.
 */
@Injectable()
export class ConsolidationService {
  private readonly logger = new Logger(ConsolidationService.name);

  constructor(
    @InjectModel(CompanyGroup.name) private groupModel: Model<CompanyGroupDocument>,
    @InjectModel('JournalEntry') private entryModel: Model<any>,
    @InjectModel('Invoice') private invoiceModel: Model<any>,
    @InjectModel('Account') private accountModel: Model<any>,
  ) {}

  async createGroup(data: Partial<CompanyGroup>) {
    const ctx = requireCurrentTenant();
    return this.groupModel.create({ ...data, tenantId: ctx.tenantId, createdBy: ctx.userId });
  }

  async findGroups() {
    const ctx = requireCurrentTenant();
    return this.groupModel.find({ tenantId: ctx.tenantId }).populate('companyIds', 'razaoSocial cnpj');
  }

  /**
   * Gera DRE consolidada para um grupo de empresas.
   */
  async generateConsolidatedDre(groupId: string, year: number) {
    const ctx = requireCurrentTenant();
    const group = await this.groupModel.findOne({ _id: groupId, tenantId: ctx.tenantId });
    if (!group) throw new NotFoundException('Grupo nao encontrado');

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Agregar receitas e despesas por conta para todas as empresas do grupo
    const entries = await this.entryModel.aggregate([
      {
        $match: {
          tenantId: ctx.tenantId,
          companyId: { $in: group.companyIds },
          date: { $gte: startDate, $lte: endDate },
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
        $group: {
          _id: { codigo: '$account.codigo', nome: '$account.nome', tipo: '$account.tipo' },
          totalDebit: { $sum: { $toDecimal: '$lines.debit' } },
          totalCredit: { $sum: { $toDecimal: '$lines.credit' } },
        },
      },
      { $sort: { '_id.codigo': 1 } },
    ]);

    // Calcular eliminacoes intercompany
    const eliminations = await this.calculateEliminations(group, year);

    // Montar DRE
    let receitaBruta = new Decimal(0);
    let deducoes = new Decimal(0);
    let custos = new Decimal(0);
    let despesas = new Decimal(0);

    for (const entry of entries) {
      const tipo = entry._id.tipo;
      const saldo = new Decimal(entry.totalCredit?.toString() || '0')
        .minus(new Decimal(entry.totalDebit?.toString() || '0'));

      if (tipo === 'Receita') receitaBruta = receitaBruta.plus(saldo);
      else if (tipo === 'Despesa') despesas = despesas.plus(saldo.abs());
      else if (tipo === 'CustoProducao') custos = custos.plus(saldo.abs());
    }

    // Aplicar eliminacoes
    receitaBruta = receitaBruta.minus(new Decimal(eliminations.totalEliminado));

    const receitaLiquida = receitaBruta.minus(deducoes);
    const lucroBruto = receitaLiquida.minus(custos);
    const lucroOperacional = lucroBruto.minus(despesas);

    return {
      grupo: group.name,
      ano: year,
      empresas: group.companyIds.length,
      dre: {
        receitaBruta: receitaBruta.toFixed(2),
        deducoes: deducoes.toFixed(2),
        receitaLiquida: receitaLiquida.toFixed(2),
        custos: custos.toFixed(2),
        lucroBruto: lucroBruto.toFixed(2),
        despesas: despesas.toFixed(2),
        lucroOperacional: lucroOperacional.toFixed(2),
      },
      eliminacoes: eliminations,
    };
  }

  /**
   * Identifica e calcula eliminacoes intercompany.
   * Busca NFs entre empresas do grupo (mesmo CNPJ em fornecedor/cliente).
   */
  private async calculateEliminations(group: CompanyGroupDocument, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Buscar CNPJs das empresas do grupo
    const companies = await this.invoiceModel.db
      .collection('companies')
      .find({ _id: { $in: group.companyIds } })
      .project({ cnpj: 1 })
      .toArray();

    const groupCnpjs = new Set(companies.map((c) => c.cnpj?.replace(/\D/g, '')).filter(Boolean));

    // Buscar NFs intercompany (fornecedor/cliente eh empresa do grupo)
    const intercompany = await this.invoiceModel.find({
      tenantId: group.tenantId,
      companyId: { $in: group.companyIds },
      status: 'escriturada',
      dataEmissao: { $gte: startDate, $lte: endDate },
      fornecedorClienteCnpj: { $in: [...groupCnpjs] },
    });

    let totalEliminado = new Decimal(0);
    const details: Array<{ cnpjOrigem: string; cnpjDestino: string; valor: string }> = [];

    for (const inv of intercompany) {
      const valor = new Decimal(inv.totalNota?.toString() || '0');
      totalEliminado = totalEliminado.plus(valor);
      details.push({
        cnpjOrigem: inv.fornecedorClienteCnpj,
        cnpjDestino: '', // Empresa emissora
        valor: valor.toFixed(2),
      });
    }

    return {
      totalEliminado: totalEliminado.toFixed(2),
      transacoesIntercompany: details.length,
      details: details.slice(0, 50),
    };
  }
}
