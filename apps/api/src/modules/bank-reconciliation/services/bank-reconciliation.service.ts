import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model } from 'mongoose';
import { Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BankAccount, BankAccountDocument } from '../schemas/bank-account.schema';
import {
  BankTransaction,
  BankTransactionDocument,
  BankTransactionStatus,
} from '../schemas/bank-transaction.schema';
import { OfxParserService, ParsedOfxResult } from './ofx-parser.service';
import { requireCurrentTenant } from '../../tenant/tenant.context';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import type { ReconciliationJobData } from '../processors/bank-reconciliation.processor';

@Injectable()
export class BankReconciliationService {
  private readonly logger = new Logger(BankReconciliationService.name);

  constructor(
    @InjectModel(BankAccount.name) private bankAccountModel: Model<BankAccountDocument>,
    @InjectModel(BankTransaction.name) private transactionModel: Model<BankTransactionDocument>,
    private ofxParser: OfxParserService,
    private eventEmitter: EventEmitter2,
    @InjectQueue(QUEUE_NAMES.BANK_RECONCILIATION) private reconciliationQueue: Queue<ReconciliationJobData>,
  ) {}

  // ── Bank Account CRUD ──────────────────────────

  async createBankAccount(companyId: string, data: Partial<BankAccount>) {
    const ctx = requireCurrentTenant();
    return this.bankAccountModel.create({
      ...data,
      tenantId: ctx.tenantId,
      companyId,
      createdBy: ctx.userId,
    });
  }

  async findBankAccounts(companyId: string) {
    const ctx = requireCurrentTenant();
    return this.bankAccountModel.find({
      tenantId: ctx.tenantId,
      companyId,
      isActive: true,
    });
  }

  async findBankAccountById(id: string) {
    const ctx = requireCurrentTenant();
    const account = await this.bankAccountModel.findOne({
      _id: id,
      tenantId: ctx.tenantId,
    });
    if (!account) throw new NotFoundException('Conta bancaria nao encontrada');
    return account;
  }

  // ── OFX Import ─────────────────────────────────

  /**
   * Importa extrato bancario a partir de conteudo OFX.
   * Faz dedup por FITID para evitar transacoes duplicadas.
   */
  async importOfx(
    companyId: string,
    bankAccountId: string,
    ofxContent: string,
  ): Promise<{ imported: number; duplicates: number; total: number }> {
    const ctx = requireCurrentTenant();

    // Verificar que a conta bancaria existe
    const bankAccount = await this.bankAccountModel.findOne({
      _id: bankAccountId,
      tenantId: ctx.tenantId,
      companyId,
    });
    if (!bankAccount) throw new NotFoundException('Conta bancaria nao encontrada');

    // Parsear OFX
    const parsed: ParsedOfxResult = this.ofxParser.parse(ofxContent);

    let imported = 0;
    let duplicates = 0;

    for (const tx of parsed.transactions) {
      // Verificar duplicidade por FITID
      const existing = await this.transactionModel.findOne({
        tenantId: ctx.tenantId,
        bankAccountId,
        fitid: tx.fitid,
      });

      if (existing) {
        duplicates++;
        continue;
      }

      await this.transactionModel.create({
        tenantId: ctx.tenantId,
        companyId,
        bankAccountId,
        fitid: tx.fitid,
        date: tx.date,
        amount: tx.amount.toString(),
        memo: tx.memo,
        type: tx.type,
        status: BankTransactionStatus.Pendente,
        source: 'ofx',
        createdBy: ctx.userId,
      });
      imported++;
    }

    this.logger.log(
      `OFX importado: ${imported} novas, ${duplicates} duplicadas de ${parsed.transactions.length} total`,
    );

    // Emitir evento e enfileirar conciliacao automatica
    if (imported > 0) {
      this.eventEmitter.emit('bank.transactions.imported', {
        tenantId: ctx.tenantId,
        companyId,
        bankAccountId,
        count: imported,
      });

      // Enfileirar conciliacao automatica
      await this.reconciliationQueue.add('auto-reconcile', {
        tenantContext: { tenantId: ctx.tenantId, userId: ctx.userId, role: ctx.role },
        companyId,
        bankAccountId,
      });
    }

    return { imported, duplicates, total: parsed.transactions.length };
  }

  // ── Transactions ───────────────────────────────

  async findTransactions(
    companyId: string,
    bankAccountId: string,
    options?: {
      status?: BankTransactionStatus;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const ctx = requireCurrentTenant();
    const filter: any = {
      tenantId: ctx.tenantId,
      companyId,
      bankAccountId,
    };

    if (options?.status) filter.status = options.status;
    if (options?.startDate || options?.endDate) {
      filter.date = {};
      if (options.startDate) filter.date.$gte = new Date(options.startDate);
      if (options.endDate) filter.date.$lte = new Date(options.endDate);
    }

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 50;

    const [data, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.transactionModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Marca uma transacao como conciliada (associada a um lancamento ou NF).
   */
  async reconcile(
    transactionId: string,
    journalEntryId?: string,
    invoiceId?: string,
  ) {
    const ctx = requireCurrentTenant();
    const tx = await this.transactionModel.findOne({
      _id: transactionId,
      tenantId: ctx.tenantId,
    });
    if (!tx) throw new NotFoundException('Transacao nao encontrada');

    tx.status = BankTransactionStatus.Conciliada;
    if (journalEntryId) tx.journalEntryId = journalEntryId as any;
    if (invoiceId) tx.invoiceId = invoiceId as any;
    await tx.save();

    this.eventEmitter.emit('bank.transaction.reconciled', {
      tenantId: ctx.tenantId,
      companyId: tx.companyId.toString(),
      transactionId: tx._id.toString(),
      amount: tx.amount?.toString(),
    });

    return tx;
  }

  /**
   * Marca transacao como ignorada (nao sera conciliada).
   */
  async ignore(transactionId: string) {
    const ctx = requireCurrentTenant();
    const tx = await this.transactionModel.findOneAndUpdate(
      { _id: transactionId, tenantId: ctx.tenantId },
      { status: BankTransactionStatus.Ignorada },
      { new: true },
    );
    if (!tx) throw new NotFoundException('Transacao nao encontrada');
    return tx;
  }

  /**
   * Retorna resumo de conciliacao para uma conta bancaria.
   */
  async getSummary(companyId: string, bankAccountId: string) {
    const ctx = requireCurrentTenant();
    const baseFilter = { tenantId: ctx.tenantId, companyId, bankAccountId };

    const [pendentes, conciliadas, ignoradas] = await Promise.all([
      this.transactionModel.countDocuments({ ...baseFilter, status: BankTransactionStatus.Pendente }),
      this.transactionModel.countDocuments({ ...baseFilter, status: BankTransactionStatus.Conciliada }),
      this.transactionModel.countDocuments({ ...baseFilter, status: BankTransactionStatus.Ignorada }),
    ]);

    return { pendentes, conciliadas, ignoradas, total: pendentes + conciliadas + ignoradas };
  }
}
