import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import axios from 'axios';
import { Integration, IntegrationDocument, IntegrationStatus } from './schemas/integration.schema';

/**
 * Servico de despacho de webhooks para integracoes externas.
 *
 * Escuta eventos do sistema e despacha para integracoes cadastradas
 * que assinam esses eventos. Implementa retry com backoff exponencial.
 *
 * Payload padrao enviado:
 * {
 *   event: "invoice.posted",
 *   timestamp: "2026-03-21T...",
 *   tenantId: "...",
 *   data: { ... payload do evento ... }
 * }
 */
@Injectable()
export class IntegrationWebhookService implements OnModuleInit {
  private readonly logger = new Logger(IntegrationWebhookService.name);

  constructor(
    @InjectModel(Integration.name) private integrationModel: Model<IntegrationDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    this.eventEmitter.onAny(async (event: string, payload: any) => {
      if (event.startsWith('webhook.') || event.startsWith('workflow.')) return;
      await this.dispatchWebhooks(event, payload);
    });
    this.logger.log('Webhook dispatcher inicializado');
  }

  private async dispatchWebhooks(event: string, payload: any) {
    const tenantId = payload?.tenantId;
    if (!tenantId) return;

    const integrations = await this.integrationModel.find({
      tenantId,
      status: IntegrationStatus.Active,
      webhookUrl: { $exists: true, $ne: '' },
      subscribedEvents: event,
    });

    for (const integration of integrations) {
      this.sendWebhook(integration, event, payload).catch((err) => {
        this.logger.error(`Webhook falhou para ${integration.name}: ${err.message}`);
      });
    }
  }

  private async sendWebhook(
    integration: IntegrationDocument,
    event: string,
    payload: any,
    attempt = 1,
  ) {
    const maxAttempts = 3;

    try {
      await axios.post(
        integration.webhookUrl!,
        {
          event,
          timestamp: new Date().toISOString(),
          tenantId: integration.tenantId.toString(),
          integrationId: integration._id.toString(),
          data: payload,
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'X-Contabilita-Event': event,
            'X-Contabilita-Signature': 'TODO-HMAC', // Em producao: HMAC-SHA256 do body
          },
        },
      );

      integration.lastSyncAt = new Date();
      integration.errorMessage = undefined;
      await integration.save();
    } catch (error) {
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt) * 1000;
        setTimeout(() => this.sendWebhook(integration, event, payload, attempt + 1), delay);
      } else {
        integration.errorMessage = `Webhook falhou apos ${maxAttempts} tentativas: ${error.message}`;
        await integration.save();
      }
    }
  }
}
