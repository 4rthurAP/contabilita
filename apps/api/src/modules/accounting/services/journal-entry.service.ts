import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import Decimal from 'decimal.js';
import { JournalEntry, JournalEntryDocument } from '../schemas/journal-entry.schema';
import { Account, AccountDocument } from '../schemas/account.schema';
import { AccountingPeriod, AccountingPeriodDocument } from '../schemas/accounting-period.schema';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';
import { requireCurrentTenant } from '../../tenant/tenant.context';
import { StatusPeriodo, NaturezaConta } from '@contabilita/shared';

@Injectable()
export class JournalEntryService {
  constructor(
    @InjectModel(JournalEntry.name) private journalEntryModel: Model<JournalEntryDocument>,
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    @InjectModel(AccountingPeriod.name) private periodModel: Model<AccountingPeriodDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  /**
   * Cria lancamento contabil com validacao de partida dobrada.
   * Usa MongoDB transaction para garantir atomicidade.
   */
  async create(companyId: string, dto: CreateJournalEntryDto) {
    const ctx = requireCurrentTenant();

    // Validar partida dobrada: sum(debitos) == sum(creditos)
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const line of dto.lines) {
      const debit = new Decimal(line.debit || '0');
      const credit = new Decimal(line.credit || '0');

      if (debit.isNegative() || credit.isNegative()) {
        throw new BadRequestException('Valores nao podem ser negativos');
      }
      if (debit.isZero() && credit.isZero()) {
        throw new BadRequestException('Cada linha deve ter debito ou credito preenchido');
      }
      if (!debit.isZero() && !credit.isZero()) {
        throw new BadRequestException('Cada linha deve ter apenas debito ou credito, nao ambos');
      }

      totalDebit = totalDebit.plus(debit);
      totalCredit = totalCredit.plus(credit);
    }

    if (!totalDebit.equals(totalCredit)) {
      throw new BadRequestException(
        `Partida dobrada invalida: debitos (${totalDebit}) != creditos (${totalCredit})`,
      );
    }

    if (totalDebit.isZero()) {
      throw new BadRequestException('Lancamento nao pode ter valor zero');
    }

    // Validar contas e periodo dentro de uma transaction
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      // Verificar que todas as contas existem e sao analiticas
      const accountIds = dto.lines.map((l) => l.accountId);
      const accounts = await this.accountModel
        .find({ _id: { $in: accountIds }, tenantId: ctx.tenantId, companyId })
        .session(session);

      if (accounts.length !== new Set(accountIds).size) {
        throw new BadRequestException('Uma ou mais contas nao encontradas');
      }

      for (const acc of accounts) {
        if (!acc.isAnalytical) {
          throw new BadRequestException(`Conta ${acc.codigo} - ${acc.nome} nao e analitica`);
        }
        if (!acc.isActive) {
          throw new BadRequestException(`Conta ${acc.codigo} - ${acc.nome} esta inativa`);
        }
      }

      // Verificar periodo contabil aberto
      const entryDate = new Date(dto.date);
      const month = entryDate.getMonth() + 1;
      const year = entryDate.getFullYear();

      const period = await this.periodModel
        .findOne({ tenantId: ctx.tenantId, companyId, year, month })
        .session(session);

      if (period && period.status === StatusPeriodo.Fechado) {
        throw new ForbiddenException(`Periodo ${month}/${year} esta fechado`);
      }

      // Gerar numero sequencial
      const lastEntry = await this.journalEntryModel
        .findOne({ tenantId: ctx.tenantId, companyId })
        .sort({ numero: -1 })
        .session(session);
      const numero = (lastEntry?.numero || 0) + 1;

      const entry = await this.journalEntryModel.create(
        [
          {
            tenantId: ctx.tenantId,
            companyId,
            numero,
            date: entryDate,
            tipo: dto.tipo,
            description: dto.description,
            lines: dto.lines.map((l) => ({
              accountId: l.accountId,
              debit: l.debit || '0',
              credit: l.credit || '0',
              costCenterId: l.costCenterId || undefined,
              historico: l.historico,
            })),
            totalDebit: totalDebit.toString(),
            totalCredit: totalCredit.toString(),
            periodId: period?._id,
            createdBy: ctx.userId,
            updatedBy: ctx.userId,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return entry[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findAll(companyId: string, page = 1, limit = 20, startDate?: string, endDate?: string) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, companyId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.journalEntryModel
        .find(filter)
        .populate('lines.accountId', 'codigo nome')
        .sort({ date: -1, numero: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.journalEntryModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const entry = await this.journalEntryModel
      .findOne({ _id: id, tenantId: ctx.tenantId, companyId })
      .populate('lines.accountId', 'codigo nome natureza');
    if (!entry) throw new NotFoundException('Lancamento nao encontrado');
    return entry;
  }

  /**
   * Razao (General Ledger) — movimentacoes de uma conta em um periodo.
   */
  async getLedger(
    companyId: string,
    accountId: string,
    startDate: string,
    endDate: string,
  ) {
    const ctx = requireCurrentTenant();

    const account = await this.accountModel.findOne({
      _id: accountId,
      tenantId: ctx.tenantId,
      companyId,
    });
    if (!account) throw new NotFoundException('Conta nao encontrada');

    const entries = await this.journalEntryModel
      .find({
        tenantId: ctx.tenantId,
        companyId,
        'lines.accountId': accountId,
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
      })
      .sort({ date: 1, numero: 1 })
      .populate('lines.accountId', 'codigo nome');

    // Montar razao com saldo acumulado
    let saldo = new Decimal(0);
    const movements = [];

    for (const entry of entries) {
      for (const line of entry.lines) {
        if (line.accountId.toString() === accountId || (line.accountId as any)?._id?.toString() === accountId) {
          const debit = new Decimal(line.debit?.toString() || '0');
          const credit = new Decimal(line.credit?.toString() || '0');

          // Saldo depende da natureza: devedora soma debitos, credora soma creditos
          if (account.natureza === NaturezaConta.Devedora) {
            saldo = saldo.plus(debit).minus(credit);
          } else {
            saldo = saldo.plus(credit).minus(debit);
          }

          movements.push({
            date: entry.date,
            numero: entry.numero,
            description: entry.description,
            historico: line.historico,
            debit: debit.toString(),
            credit: credit.toString(),
            saldo: saldo.toString(),
          });
        }
      }
    }

    return {
      account: { id: account._id, codigo: account.codigo, nome: account.nome, natureza: account.natureza },
      startDate,
      endDate,
      movements,
      saldoFinal: saldo.toString(),
    };
  }

  /**
   * Balancete de Verificacao (Trial Balance).
   * Calcula saldo de todas as contas analiticas no periodo.
   */
  async getTrialBalance(companyId: string, startDate: string, endDate: string) {
    const ctx = requireCurrentTenant();

    const results = await this.journalEntryModel.aggregate([
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
        $lookup: {
          from: 'accounts',
          localField: '_id',
          foreignField: '_id',
          as: 'account',
        },
      },
      { $unwind: '$account' },
      {
        $project: {
          _id: 0,
          accountId: '$_id',
          codigo: '$account.codigo',
          nome: '$account.nome',
          tipo: '$account.tipo',
          natureza: '$account.natureza',
          totalDebit: { $toString: '$totalDebit' },
          totalCredit: { $toString: '$totalCredit' },
        },
      },
      { $sort: { codigo: 1 } },
    ]);

    // Calcula saldo de cada conta e totais gerais
    let grandTotalDebit = new Decimal(0);
    let grandTotalCredit = new Decimal(0);

    const accounts = results.map((r) => {
      const debit = new Decimal(r.totalDebit);
      const credit = new Decimal(r.totalCredit);
      grandTotalDebit = grandTotalDebit.plus(debit);
      grandTotalCredit = grandTotalCredit.plus(credit);

      let saldo: Decimal;
      if (r.natureza === NaturezaConta.Devedora) {
        saldo = debit.minus(credit);
      } else {
        saldo = credit.minus(debit);
      }

      return {
        ...r,
        saldo: saldo.toString(),
        saldoNatureza: saldo.isNegative() ? 'invertido' : 'normal',
      };
    });

    return {
      startDate,
      endDate,
      accounts,
      totals: {
        totalDebit: grandTotalDebit.toString(),
        totalCredit: grandTotalCredit.toString(),
        balanced: grandTotalDebit.equals(grandTotalCredit),
      },
    };
  }
}
