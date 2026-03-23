import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from 'bullmq';
import Decimal from 'decimal.js';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import { BankTransaction, BankTransactionDocument, BankTransactionStatus } from '../schemas/bank-transaction.schema';
import { Invoice, InvoiceDocument } from '../../fiscal/schemas/invoice.schema';
import { tenantContext } from '../../tenant/tenant.context';

export interface ReconciliationJobData {
  tenantContext: { tenantId: string; userId: string; role: string };
  companyId: string;
  bankAccountId: string;
}

interface ReconciliationMatch {
  transactionId: string;
  invoiceId?: string;
  confidence: number;
  method: string;
}

/**
 * Processador de conciliacao bancaria automatica.
 *
 * Estrategias de matching (por ordem de confianca):
 * 1. CNPJ exato + valor exato = 0.95
 * 2. Valor exato + data proxima (±3 dias) = 0.85
 * 3. Memo contem nome do fornecedor/cliente = 0.70
 * 4. Padrao historico (mesma conta usada para valor similar) = 0.60
 */
@Processor(QUEUE_NAMES.BANK_RECONCILIATION)
export class BankReconciliationProcessor extends WorkerHost {
  private readonly logger = new Logger(BankReconciliationProcessor.name);

  constructor(
    @InjectModel(BankTransaction.name) private txModel: Model<BankTransactionDocument>,
    @InjectModel('Invoice') private invoiceModel: Model<InvoiceDocument>,
  ) {
    super();
  }

  async process(job: Job<ReconciliationJobData>) {
    const { tenantContext: ctx, companyId, bankAccountId } = job.data;

    return tenantContext.run(ctx, async () => {
      // Buscar transacoes pendentes
      const pendingTxs = await this.txModel.find({
        tenantId: ctx.tenantId,
        companyId,
        bankAccountId,
        status: BankTransactionStatus.Pendente,
        suggestionConfidence: { $exists: false },
      });

      if (pendingTxs.length === 0) {
        return { matched: 0, total: 0 };
      }

      // Buscar notas fiscais do periodo para matching
      const oldestTx = pendingTxs.reduce((min, tx) =>
        tx.date < min.date ? tx : min, pendingTxs[0]);
      const newestTx = pendingTxs.reduce((max, tx) =>
        tx.date > max.date ? tx : max, pendingTxs[0]);

      const invoices = await this.invoiceModel.find({
        tenantId: ctx.tenantId,
        companyId,
        status: 'escriturada',
        dataEmissao: {
          $gte: new Date(oldestTx.date.getTime() - 30 * 24 * 3600 * 1000),
          $lte: new Date(newestTx.date.getTime() + 7 * 24 * 3600 * 1000),
        },
      });

      // Buscar conciliacoes anteriores para aprendizado de padroes
      const historicalMatches = await this.txModel.find({
        tenantId: ctx.tenantId,
        companyId,
        status: BankTransactionStatus.Conciliada,
        invoiceId: { $exists: true },
      }).limit(500).select('memo amount invoiceId');

      let matchCount = 0;

      for (let i = 0; i < pendingTxs.length; i++) {
        const tx = pendingTxs[i];
        const match = this.findBestMatch(tx, invoices, historicalMatches);

        if (match) {
          await this.txModel.updateOne(
            { _id: tx._id },
            {
              suggestedInvoiceId: match.invoiceId,
              suggestionConfidence: match.confidence,
              suggestionMethod: match.method,
            },
          );
          matchCount++;
        }

        await job.updateProgress(Math.round(((i + 1) / pendingTxs.length) * 100));
      }

      this.logger.log(
        `Conciliacao automatica: ${matchCount}/${pendingTxs.length} transacoes com sugestao`,
      );

      return { matched: matchCount, total: pendingTxs.length };
    });
  }

  private findBestMatch(
    tx: BankTransactionDocument,
    invoices: InvoiceDocument[],
    historicalMatches: BankTransactionDocument[],
  ): ReconciliationMatch | null {
    const txAmount = new Decimal(tx.amount?.toString() || '0').abs();
    const txMemo = (tx.memo || '').toLowerCase();
    let bestMatch: ReconciliationMatch | null = null;

    for (const inv of invoices) {
      const invAmount = new Decimal(inv.totalNota?.toString() || '0');
      const amountDiff = txAmount.minus(invAmount).abs();
      const amountMatch = amountDiff.lte(new Decimal('0.01'));

      const daysDiff = Math.abs(
        (tx.date.getTime() - new Date(inv.dataEmissao).getTime()) / (24 * 3600 * 1000),
      );

      // Estrategia 1: CNPJ exato + valor exato
      if (
        tx.counterpartDocument &&
        inv.fornecedorClienteCnpj &&
        tx.counterpartDocument === inv.fornecedorClienteCnpj &&
        amountMatch
      ) {
        return {
          transactionId: tx._id.toString(),
          invoiceId: inv._id.toString(),
          confidence: 0.95,
          method: 'cnpj_match',
        };
      }

      // Estrategia 2: Valor exato + data proxima
      if (amountMatch && daysDiff <= 3) {
        const confidence = 0.85 - (daysDiff * 0.02);
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = {
            transactionId: tx._id.toString(),
            invoiceId: inv._id.toString(),
            confidence,
            method: 'exact_amount',
          };
        }
      }

      // Estrategia 3: Nome no memo
      const nome = (inv.fornecedorClienteNome || '').toLowerCase();
      if (nome.length > 3 && txMemo.includes(nome) && amountMatch) {
        const confidence = 0.70;
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = {
            transactionId: tx._id.toString(),
            invoiceId: inv._id.toString(),
            confidence,
            method: 'memo_match',
          };
        }
      }
    }

    // Estrategia 4: Padrao historico — mesmo memo levou a mesma NF anteriormente
    if (!bestMatch) {
      for (const hist of historicalMatches) {
        const histMemo = (hist.memo || '').toLowerCase();
        if (
          histMemo === txMemo &&
          hist.invoiceId
        ) {
          bestMatch = {
            transactionId: tx._id.toString(),
            invoiceId: hist.invoiceId.toString(),
            confidence: 0.60,
            method: 'historical',
          };
          break;
        }
      }
    }

    return bestMatch;
  }
}
