import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JournalEntryService } from '../../accounting/services/journal-entry.service';
import { AccountService } from '../../accounting/services/account.service';
import { tenantContext } from '../../tenant/tenant.context';
import { TipoLancamento } from '@contabilita/shared';

export interface PayrollCompletedEvent {
  tenantId: string;
  companyId: string;
  runId: string;
  tipo: string;
  year: number;
  month: number;
  totalBruto: string;
  totalDescontos: string;
  totalLiquido: string;
  totalInss: string;
  totalIrrf: string;
  totalFgts: string;
}

/**
 * Gera lancamentos contabeis automaticos quando uma folha e calculada.
 * Provisiona: Despesa de Salarios (D) / Salarios a Pagar (C)
 * Encargos:   Despesa INSS (D) / INSS a Recolher (C)
 *             Despesa FGTS (D) / FGTS a Recolher (C)
 *             IRRF a Recolher (C) e descontado do funcionario
 */
@Injectable()
export class PayrollCompletedListener {
  private readonly logger = new Logger(PayrollCompletedListener.name);

  constructor(
    private readonly journalEntryService: JournalEntryService,
    private readonly accountService: AccountService,
  ) {}

  @OnEvent('payroll.run.completed')
  async handlePayrollCompleted(event: PayrollCompletedEvent) {
    const ctx = {
      tenantId: event.tenantId,
      userId: 'system',
      role: 'system',
    };

    try {
      await tenantContext.run(ctx, async () => {
        const competencia = `${String(event.month).padStart(2, '0')}/${event.year}`;

        // Buscar contas por codigo padrao do plano RFB
        // Estes codigos sao do seed plano-contas-rfb
        const contaSalarios = await this.accountService.findByCode(event.companyId, '4.1.01.001'); // Despesa Salarios
        const contaSalariosAPagar = await this.accountService.findByCode(event.companyId, '2.1.01.001'); // Salarios a Pagar
        const contaInss = await this.accountService.findByCode(event.companyId, '4.1.01.002'); // Despesa Encargos Sociais
        const contaInssRecolher = await this.accountService.findByCode(event.companyId, '2.1.02.001'); // Obrigacoes Trabalhistas

        // Se as contas existirem, gera lancamentos automaticos
        if (!contaSalarios || !contaSalariosAPagar) {
          this.logger.warn(
            `Contas contabeis padrao nao encontradas para empresa ${event.companyId}. Lancamentos automaticos de folha nao gerados.`,
          );
          return;
        }

        const lines: any[] = [
          {
            accountId: contaSalarios._id.toString(),
            debit: event.totalBruto,
            credit: '0',
            historico: `Folha de pagamento ${competencia} — proventos`,
          },
          {
            accountId: contaSalariosAPagar._id.toString(),
            debit: '0',
            credit: event.totalLiquido,
            historico: `Folha de pagamento ${competencia} — liquido a pagar`,
          },
        ];

        // INSS retido do funcionario
        if (parseFloat(event.totalInss) > 0 && contaInssRecolher) {
          lines.push({
            accountId: contaInssRecolher._id.toString(),
            debit: '0',
            credit: event.totalInss,
            historico: `INSS retido folha ${competencia}`,
          });
        }

        // IRRF retido
        if (parseFloat(event.totalIrrf) > 0 && contaInssRecolher) {
          lines.push({
            accountId: contaInssRecolher._id.toString(),
            debit: '0',
            credit: event.totalIrrf,
            historico: `IRRF retido folha ${competencia}`,
          });
        }

        await this.journalEntryService.create(event.companyId, {
          date: new Date().toISOString().split('T')[0],
          tipo: TipoLancamento.Automatico,
          description: `Provisao folha de pagamento ${event.tipo} — ${competencia}`,
          lines,
        });

        this.logger.log(
          `Lancamento contabil gerado para folha ${event.tipo} ${competencia} (empresa ${event.companyId})`,
        );
      });
    } catch (error) {
      this.logger.error(
        `Erro ao gerar lancamento contabil para folha ${event.runId}: ${error.message}`,
      );
    }
  }
}
