import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaxAssessmentService } from '../services/tax-assessment.service';
import { TaxPaymentService } from '../services/tax-payment.service';
import { AccountingTemplateService } from '../../accounting/services/accounting-template.service';
import { JournalEntryService } from '../../accounting/services/journal-entry.service';
import { tenantContext } from '../../tenant/tenant.context';
import Decimal from 'decimal.js';

export interface InvoicePostedEvent {
  invoiceId: string;
  tenantId: string;
  companyId: string;
  tipo: string;
  dataEmissao: Date;
  totalNota: string;
  totalIcms: string;
  totalPis: string;
  totalCofins: string;
  totalIpi: string;
  totalIss: string;
  numero?: string;
  fornecedorClienteNome?: string;
  cfops?: string[];
}

/**
 * Listener que reage a escrituracao de NFs:
 * 1. Recalcula a apuracao fiscal do mes
 * 2. Gera guias de pagamento
 * 3. Gera lancamento contabil automatico (quando template configurado)
 */
@Injectable()
export class InvoicePostedListener {
  private readonly logger = new Logger(InvoicePostedListener.name);

  constructor(
    private taxAssessmentService: TaxAssessmentService,
    private taxPaymentService: TaxPaymentService,
    private templateService: AccountingTemplateService,
    private journalEntryService: JournalEntryService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('invoice.posted')
  async handle(event: InvoicePostedEvent) {
    const date = new Date(event.dataEmissao);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Executar dentro do tenant context para que os services funcionem
    await tenantContext.run(
      { tenantId: event.tenantId, userId: 'system', role: 'Admin' },
      async () => {
        // 1. Recalcular apuracao do mes
        await this.taxAssessmentService.recalculate(event.companyId, year, month);

        // 2. Gerar guias de pagamento a partir da apuracao
        try {
          const payments = await this.taxPaymentService.generateFromAssessment(
            event.companyId,
            year,
            month,
          );
          if (payments.length > 0) {
            this.eventEmitter.emit('tax.payment.generated', {
              tenantId: event.tenantId,
              companyId: event.companyId,
              payments: payments.map((p) => ({
                tipo: p.tipo,
                tipoGuia: p.tipoGuia,
                valor: p.valorTotal?.toString(),
                vencimento: p.dataVencimento,
              })),
            });
          }
        } catch (err) {
          this.logger.warn(`Erro ao gerar guias para NF ${event.invoiceId}: ${err}`);
        }

        // 3. Gerar lancamento contabil automatico
        try {
          await this.generateJournalEntry(event);
        } catch (err) {
          this.logger.warn(
            `Erro ao gerar lancamento para NF ${event.invoiceId}: ${err}`,
          );
        }
      },
    );
  }

  /**
   * Gera lancamento contabil a partir de template configurado.
   * Se nenhum template for encontrado, nao gera lancamento (fluxo manual).
   */
  private async generateJournalEntry(event: InvoicePostedEvent) {
    const template = await this.templateService.findBestMatch(
      event.tenantId,
      event.companyId,
      event.tipo,
      event.cfops || [],
    );

    if (!template) {
      this.logger.debug(
        `Nenhum template contabil para NF ${event.invoiceId} (tipo: ${event.tipo}). Lancamento manual necessario.`,
      );
      return;
    }

    const totalNota = new Decimal(event.totalNota || '0');
    if (totalNota.isZero()) return;

    // Montar historico usando template
    const historico = template.historicoTemplate
      .replace('{numero}', event.numero || '')
      .replace('{fornecedor}', event.fornecedorClienteNome || '')
      .replace('{valor}', totalNota.toDecimalPlaces(2).toString());

    // Linhas do lancamento — lancamento principal (valor da nota)
    const lines: Array<{
      accountId: string;
      debit: string;
      credit: string;
      historico: string;
    }> = [
      {
        accountId: template.contaDebitoId.toString(),
        debit: totalNota.toDecimalPlaces(2).toString(),
        credit: '0',
        historico,
      },
      {
        accountId: template.contaCreditoId.toString(),
        debit: '0',
        credit: totalNota.toDecimalPlaces(2).toString(),
        historico,
      },
    ];

    // Lancamentos adicionais para impostos (quando configurado)
    if (template.gerarLancamentosImpostos) {
      const taxEntries = [
        { valor: event.totalIcms, contaId: template.contaIcmsRecuperarId, nome: 'ICMS' },
        { valor: event.totalPis, contaId: template.contaPisRecuperarId, nome: 'PIS' },
        { valor: event.totalCofins, contaId: template.contaCofinsRecuperarId, nome: 'COFINS' },
      ];

      for (const tax of taxEntries) {
        const valor = new Decimal(tax.valor || '0');
        if (!valor.isZero() && tax.contaId) {
          lines.push({
            accountId: tax.contaId.toString(),
            debit: valor.toDecimalPlaces(2).toString(),
            credit: '0',
            historico: `${tax.nome} s/ NF ${event.numero || ''}`,
          });
          lines.push({
            accountId: template.contaCreditoId.toString(),
            debit: '0',
            credit: valor.toDecimalPlaces(2).toString(),
            historico: `${tax.nome} s/ NF ${event.numero || ''}`,
          });
        }
      }
    }

    await this.journalEntryService.create(event.companyId, {
      date: new Date(event.dataEmissao).toISOString().split('T')[0],
      tipo: 'automatico',
      description: historico,
      lines,
    });

    this.logger.log(
      `Lancamento contabil gerado automaticamente para NF ${event.invoiceId}`,
    );
  }
}
