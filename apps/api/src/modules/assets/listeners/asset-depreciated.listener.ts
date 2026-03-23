import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JournalEntryService } from '../../accounting/services/journal-entry.service';
import { AccountService } from '../../accounting/services/account.service';
import { tenantContext } from '../../tenant/tenant.context';
import { AssetDepreciatedEvent } from '../assets.service';
import Decimal from 'decimal.js';

/**
 * Listener que gera lancamentos contabeis automaticos apos depreciacao.
 *
 * Lancamentos gerados:
 * 1. Depreciacao: D - Despesa de Depreciacao / C - Depreciacao Acumulada
 * 2. CIAP (se aplicavel): D - ICMS a Recuperar / C - ICMS s/ Ativo Imobilizado
 */
@Injectable()
export class AssetDepreciatedListener {
  private readonly logger = new Logger(AssetDepreciatedListener.name);

  constructor(
    private readonly journalEntryService: JournalEntryService,
    private readonly accountService: AccountService,
  ) {}

  @OnEvent('asset.depreciated')
  async handle(event: AssetDepreciatedEvent) {
    await tenantContext.run(
      { tenantId: event.tenantId, userId: 'system', role: 'Admin' },
      async () => {
        try {
          await this.generateDepreciationEntry(event);
          await this.generateCiapEntry(event);
        } catch (error) {
          this.logger.error(
            `Erro ao gerar lancamentos de depreciacao ${event.period}: ${error}`,
          );
        }
      },
    );
  }

  /**
   * Gera lancamento de depreciacao mensal.
   * D - 4.1.03.xxx (Despesa de Depreciacao)
   * C - 1.2.04.xxx (Depreciacao Acumulada - retificadora do Ativo)
   */
  private async generateDepreciationEntry(event: AssetDepreciatedEvent) {
    const totalDeprec = new Decimal(event.totalDepreciacao);
    if (totalDeprec.isZero()) return;

    // Buscar contas padrao RFB para depreciacao
    const contaDespesa = await this.accountService.findByCode(event.companyId, '4.1.03.001');
    const contaDeprecAcum = await this.accountService.findByCode(event.companyId, '1.2.04.001');

    if (!contaDespesa || !contaDeprecAcum) {
      this.logger.warn(
        `Contas de depreciacao nao encontradas para empresa ${event.companyId}. Lancamento manual necessario.`,
      );
      return;
    }

    const historico = `Depreciacao mensal ${event.period} - ${event.results.length} bens`;

    await this.journalEntryService.create(event.companyId, {
      date: new Date().toISOString().split('T')[0],
      tipo: 'automatico',
      description: historico,
      lines: [
        {
          accountId: contaDespesa._id.toString(),
          debit: totalDeprec.toDecimalPlaces(2).toString(),
          credit: '0',
          historico,
        },
        {
          accountId: contaDeprecAcum._id.toString(),
          debit: '0',
          credit: totalDeprec.toDecimalPlaces(2).toString(),
          historico,
        },
      ],
    });

    this.logger.log(
      `Lancamento de depreciacao gerado: R$ ${totalDeprec.toFixed(2)} (${event.period})`,
    );
  }

  /**
   * Gera lancamento de credito CIAP (1/48 avos do ICMS sobre ativo imobilizado).
   * D - 1.1.05.xxx (ICMS a Recuperar)
   * C - 1.2.05.xxx (ICMS s/ Ativo Imobilizado)
   */
  private async generateCiapEntry(event: AssetDepreciatedEvent) {
    const totalCiap = new Decimal(event.totalCiapCredito);
    if (totalCiap.isZero()) return;

    const contaIcmsRecuperar = await this.accountService.findByCode(event.companyId, '1.1.05.001');
    const contaIcmsAtivo = await this.accountService.findByCode(event.companyId, '1.2.05.001');

    if (!contaIcmsRecuperar || !contaIcmsAtivo) {
      this.logger.warn(
        `Contas CIAP nao encontradas para empresa ${event.companyId}. Credito CIAP manual necessario.`,
      );
      return;
    }

    const ciapAssets = event.results.filter((r) => r.ciap && r.ciapCreditoMensal);
    const historico = `Credito CIAP ${event.period} - ${ciapAssets.length} bens`;

    await this.journalEntryService.create(event.companyId, {
      date: new Date().toISOString().split('T')[0],
      tipo: 'automatico',
      description: historico,
      lines: [
        {
          accountId: contaIcmsRecuperar._id.toString(),
          debit: totalCiap.toDecimalPlaces(2).toString(),
          credit: '0',
          historico,
        },
        {
          accountId: contaIcmsAtivo._id.toString(),
          debit: '0',
          credit: totalCiap.toDecimalPlaces(2).toString(),
          historico,
        },
      ],
    });

    this.logger.log(
      `Lancamento CIAP gerado: R$ ${totalCiap.toFixed(2)} (${event.period})`,
    );
  }
}
