import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import axios from 'axios';
import { Integration, IntegrationDocument, IntegrationProvider, IntegrationStatus } from '../schemas/integration.schema';
import { requireCurrentTenant } from '../../tenant/tenant.context';

/**
 * Servico de Open Banking via Pluggy ou Belvo.
 *
 * Fluxo:
 * 1. Cliente conecta conta bancaria via widget do provedor (OAuth consent)
 * 2. Recebemos item_id/link_id que permite acessar transacoes
 * 3. Polling periodico ou webhook busca novas transacoes
 * 4. Transacoes mapeadas para BankTransaction.schema.ts
 * 5. Evento bank.transactions.imported dispara conciliacao automatica
 */
@Injectable()
export class OpenBankingService {
  private readonly logger = new Logger(OpenBankingService.name);

  constructor(
    @InjectModel(Integration.name) private integrationModel: Model<IntegrationDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Cria conexao Open Banking via Pluggy.
   * Retorna connect_token para o widget do frontend.
   */
  async createPluggyConnection(companyId: string) {
    const ctx = requireCurrentTenant();

    const integration = await this.integrationModel.findOne({
      tenantId: ctx.tenantId,
      companyId,
      provider: IntegrationProvider.Pluggy,
    });

    const apiKey = integration?.credentials?.apiKey;
    if (!apiKey) {
      return { error: 'Pluggy API key nao configurada. Configure em Integracoes.' };
    }

    try {
      // Gerar connect token via Pluggy API
      const response = await axios.post(
        'https://api.pluggy.ai/connect_token',
        { clientId: integration.credentials?.clientId },
        {
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      return {
        connectToken: response.data.accessToken,
        provider: 'pluggy',
      };
    } catch (error) {
      this.logger.error(`Erro ao criar conexao Pluggy: ${error}`);
      return { error: `Erro ao conectar: ${error.message}` };
    }
  }

  /**
   * Processa webhook de novas transacoes do provedor.
   */
  async handleWebhook(provider: string, payload: any) {
    this.logger.log(`Open Banking webhook recebido de ${provider}`);

    if (provider === 'pluggy') {
      return this.handlePluggyWebhook(payload);
    }

    return { processed: false, reason: 'Provider nao suportado' };
  }

  private async handlePluggyWebhook(payload: any) {
    const event = payload.event;
    const itemId = payload.itemId;

    if (event === 'item/updated') {
      // Buscar transacoes atualizadas
      this.eventEmitter.emit('open-banking.transactions.ready', {
        provider: 'pluggy',
        itemId,
        timestamp: new Date(),
      });

      return { processed: true };
    }

    return { processed: false, reason: `Evento ${event} ignorado` };
  }

  /**
   * Sincroniza transacoes de uma conexao Open Banking.
   */
  async syncTransactions(integrationId: string) {
    const ctx = requireCurrentTenant();
    const integration = await this.integrationModel.findOne({
      _id: integrationId,
      tenantId: ctx.tenantId,
    }).select('+credentials');

    if (!integration) return { error: 'Integracao nao encontrada' };

    // Em producao: chamar API do provedor para buscar transacoes
    // e mapear para BankTransaction.schema.ts
    integration.lastSyncAt = new Date();
    integration.status = IntegrationStatus.Active;
    await integration.save();

    return { synced: true, lastSync: integration.lastSyncAt };
  }
}
