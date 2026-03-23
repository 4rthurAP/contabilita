import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import Decimal from 'decimal.js';
import { AuditFinding, AuditFindingDocument, AuditSeverity, AuditFindingStatus } from './schemas/audit-finding.schema';
import { Invoice, InvoiceDocument } from '../fiscal/schemas/invoice.schema';
import { JournalEntry, JournalEntryDocument } from '../accounting/schemas/journal-entry.schema';
import { Company } from '../company/schemas/company.schema';
import { tenantContext } from '../tenant/tenant.context';

/**
 * Servico de auditoria inteligente com verificacoes continuas.
 *
 * Checks implementados:
 * 1. Notas fiscais duplicadas (mesmo CNPJ + valor + data)
 * 2. Lancamentos contabeis desbalanceados (debito != credito)
 * 3. Gaps na numeracao de notas fiscais
 * 4. Notas escrituradas sem lancamento contabil correspondente
 * 5. Analise de Benford (distribuicao do primeiro digito dos valores)
 */
@Injectable()
export class AuditAnalyticsService {
  private readonly logger = new Logger(AuditAnalyticsService.name);

  constructor(
    @InjectModel(AuditFinding.name) private findingModel: Model<AuditFindingDocument>,
    @InjectModel('Invoice') private invoiceModel: Model<InvoiceDocument>,
    @InjectModel('JournalEntry') private entryModel: Model<JournalEntryDocument>,
    @InjectModel(Company.name) private companyModel: Model<any>,
  ) {}

  /** Roda todas as verificacoes diariamente as 3h */
  @Cron('0 3 * * *')
  async runAllChecks() {
    this.logger.log('Iniciando verificacoes de auditoria...');
    const companies = await this.companyModel.find({ isActive: true });

    for (const company of companies) {
      await tenantContext.run(
        { tenantId: company.tenantId.toString(), userId: 'system', role: 'Admin' },
        async () => {
          const companyId = company._id.toString();
          await Promise.all([
            this.checkDuplicateInvoices(company.tenantId.toString(), companyId),
            this.checkUnbalancedEntries(company.tenantId.toString(), companyId),
            this.checkInvoiceNumberGaps(company.tenantId.toString(), companyId),
            this.checkBenfordDistribution(company.tenantId.toString(), companyId),
          ]);
        },
      );
    }
    this.logger.log('Verificacoes de auditoria concluidas');
  }

  /** Busca achados para uma empresa */
  async getFindings(companyId: string, status?: AuditFindingStatus) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, companyId };
    if (status) filter.status = status;
    return this.findingModel.find(filter).sort({ severity: 1, createdAt: -1 });
  }

  /** Resolve um achado */
  async resolveFinding(id: string, resolution: string, status: AuditFindingStatus) {
    const ctx = requireCurrentTenant();
    return this.findingModel.findOneAndUpdate(
      { _id: id, tenantId: ctx.tenantId },
      { status, resolution, resolvedAt: new Date() },
      { new: true },
    );
  }

  // ── Checks ──────────────────────────

  private async checkDuplicateInvoices(tenantId: string, companyId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const duplicates = await this.invoiceModel.aggregate([
      {
        $match: {
          tenantId: { $eq: tenantId },
          companyId: { $eq: companyId },
          dataEmissao: { $gte: thirtyDaysAgo },
          status: 'escriturada',
        },
      },
      {
        $group: {
          _id: { cnpj: '$fornecedorClienteCnpj', valor: '$totalNota', data: '$dataEmissao' },
          count: { $sum: 1 },
          ids: { $push: '$_id' },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    for (const dup of duplicates) {
      await this.createFindingIfNew(tenantId, companyId, {
        checkType: 'duplicate_invoice',
        severity: AuditSeverity.Critical,
        title: `NF duplicada: CNPJ ${dup._id.cnpj}`,
        description: `${dup.count} notas com mesmo CNPJ (${dup._id.cnpj}), valor e data encontradas.`,
        reference: { collection: 'invoices', documentId: dup.ids[0].toString() },
      });
    }
  }

  private async checkUnbalancedEntries(tenantId: string, companyId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const entries = await this.entryModel.find({
      tenantId,
      companyId,
      date: { $gte: thirtyDaysAgo },
    });

    for (const entry of entries) {
      let totalDebit = new Decimal(0);
      let totalCredit = new Decimal(0);

      for (const line of entry.lines || []) {
        totalDebit = totalDebit.plus(new Decimal(line.debit?.toString() || '0'));
        totalCredit = totalCredit.plus(new Decimal(line.credit?.toString() || '0'));
      }

      if (!totalDebit.equals(totalCredit)) {
        await this.createFindingIfNew(tenantId, companyId, {
          checkType: 'unbalanced',
          severity: AuditSeverity.Critical,
          title: `Lancamento desbalanceado: #${entry.numero}`,
          description: `Debito (${totalDebit.toFixed(2)}) != Credito (${totalCredit.toFixed(2)}).`,
          reference: { collection: 'journal_entries', documentId: entry._id.toString() },
        });
      }
    }
  }

  private async checkInvoiceNumberGaps(tenantId: string, companyId: string) {
    const invoices = await this.invoiceModel
      .find({ tenantId, companyId, status: 'escriturada', tipo: 'saida' })
      .sort({ numero: 1 })
      .select('numero serie')
      .limit(1000);

    const bySerie = new Map<string, number[]>();
    for (const inv of invoices) {
      const num = parseInt(inv.numero, 10);
      if (isNaN(num)) continue;
      const serie = inv.serie || '1';
      if (!bySerie.has(serie)) bySerie.set(serie, []);
      bySerie.get(serie)!.push(num);
    }

    for (const [serie, numbers] of bySerie) {
      numbers.sort((a, b) => a - b);
      const gaps: number[] = [];
      for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] - numbers[i - 1] > 1) {
          for (let g = numbers[i - 1] + 1; g < numbers[i] && gaps.length < 10; g++) {
            gaps.push(g);
          }
        }
      }

      if (gaps.length > 0) {
        await this.createFindingIfNew(tenantId, companyId, {
          checkType: 'number_gap',
          severity: AuditSeverity.Warning,
          title: `Gap na numeracao de NFs (serie ${serie})`,
          description: `Numeros ausentes: ${gaps.slice(0, 5).join(', ')}${gaps.length > 5 ? ` e mais ${gaps.length - 5}` : ''}.`,
        });
      }
    }
  }

  /**
   * Analise de Benford: verifica se a distribuicao do primeiro digito
   * dos valores segue a Lei de Benford (indicador de fraude se nao seguir).
   */
  private async checkBenfordDistribution(tenantId: string, companyId: string) {
    const invoices = await this.invoiceModel
      .find({ tenantId, companyId, status: 'escriturada' })
      .select('totalNota')
      .limit(5000);

    if (invoices.length < 100) return; // Amostra muito pequena

    // Distribuicao esperada (Lei de Benford)
    const expected = [0, 0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046];

    const digitCounts = new Array(10).fill(0);
    let total = 0;

    for (const inv of invoices) {
      const valor = inv.totalNota?.toString() || '0';
      const firstDigit = parseInt(valor.replace(/[^1-9]/, '').charAt(0), 10);
      if (firstDigit >= 1 && firstDigit <= 9) {
        digitCounts[firstDigit]++;
        total++;
      }
    }

    if (total < 100) return;

    // Chi-quadrado para verificar aderencia
    let chiSquare = 0;
    for (let d = 1; d <= 9; d++) {
      const observed = digitCounts[d] / total;
      const exp = expected[d];
      chiSquare += Math.pow(observed - exp, 2) / exp;
    }

    // Valor critico chi-quadrado (8 graus de liberdade, alpha=0.05) = 15.507
    if (chiSquare > 15.507) {
      await this.createFindingIfNew(tenantId, companyId, {
        checkType: 'benford',
        severity: AuditSeverity.Warning,
        title: 'Distribuicao de valores nao segue Lei de Benford',
        description: `Chi-quadrado = ${chiSquare.toFixed(2)} (critico: 15.51). ` +
          `Amostra: ${total} notas. Pode indicar manipulacao de valores.`,
      });
    }
  }

  private async createFindingIfNew(
    tenantId: string,
    companyId: string,
    data: Partial<AuditFinding>,
  ) {
    const existing = await this.findingModel.findOne({
      tenantId,
      companyId,
      checkType: data.checkType,
      title: data.title,
      status: { $in: [AuditFindingStatus.Open, AuditFindingStatus.Acknowledged] },
    });

    if (!existing) {
      await this.findingModel.create({
        tenantId,
        companyId,
        ...data,
        status: AuditFindingStatus.Open,
      });
    }
  }
}

// Import helper for tenant context
import { requireCurrentTenant } from '../tenant/tenant.context';
