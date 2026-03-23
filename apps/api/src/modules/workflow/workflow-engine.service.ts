import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Workflow, WorkflowDocument, WorkflowCondition } from './schemas/workflow.schema';
import { NotificationService } from '../notification/notification.service';

/**
 * Motor de execucao de workflows definidos pelo usuario.
 *
 * Escuta TODOS os eventos do EventEmitter2, avalia condicoes dos workflows
 * ativos e executa as acoes configuradas.
 *
 * Eventos suportados como trigger:
 * - invoice.posted
 * - payroll.run.completed
 * - tax.payment.generated
 * - bank.transactions.imported
 * - bank.transaction.reconciled
 * - certificate.expiring
 * - asset.depreciated
 * - obligation.ready
 *
 * Acoes suportadas:
 * - create_notification: cria notificacao in-app
 * - send_email: enfileira email
 * - create_task: cria tarefa no modulo Administrar
 * - webhook: POST para URL externa
 */
@Injectable()
export class WorkflowEngineService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(
    @InjectModel(Workflow.name) private workflowModel: Model<WorkflowDocument>,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationService: NotificationService,
  ) {}

  onModuleInit() {
    // Registrar listener wildcard para capturar todos os eventos
    this.eventEmitter.onAny(async (event: string, payload: any) => {
      if (event.startsWith('workflow.')) return; // Evitar recursao
      await this.evaluateWorkflows(event, payload);
    });

    this.logger.log('Workflow engine inicializado — escutando todos os eventos');
  }

  /**
   * Avalia workflows ativos para um evento.
   */
  private async evaluateWorkflows(eventName: string, payload: any) {
    const tenantId = payload?.tenantId;
    if (!tenantId) return;

    const workflows = await this.workflowModel.find({
      tenantId,
      trigger: eventName,
      isActive: true,
    });

    for (const workflow of workflows) {
      try {
        if (this.evaluateConditions(workflow.conditions, payload)) {
          await this.executeActions(workflow, payload);

          // Atualizar contadores
          workflow.executionCount += 1;
          workflow.lastExecutedAt = new Date();
          await workflow.save();

          this.logger.debug(`Workflow "${workflow.name}" executado para evento ${eventName}`);
        }
      } catch (error) {
        this.logger.error(`Erro ao executar workflow "${workflow.name}": ${error}`);
      }
    }
  }

  /**
   * Avalia condicoes do workflow (AND logic).
   */
  private evaluateConditions(conditions: WorkflowCondition[], payload: any): boolean {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every((condition) => {
      const fieldValue = this.getNestedValue(payload, condition.field);
      return this.evaluateOperator(fieldValue, condition.operator, condition.value);
    });
  }

  private evaluateOperator(fieldValue: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'eq': return fieldValue == expected;
      case 'ne': return fieldValue != expected;
      case 'gt': return Number(fieldValue) > Number(expected);
      case 'lt': return Number(fieldValue) < Number(expected);
      case 'gte': return Number(fieldValue) >= Number(expected);
      case 'lte': return Number(fieldValue) <= Number(expected);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(expected).toLowerCase());
      case 'in':
        return Array.isArray(expected) ? expected.includes(fieldValue) : false;
      default: return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((val, key) => val?.[key], obj);
  }

  /**
   * Executa acoes do workflow.
   */
  private async executeActions(workflow: WorkflowDocument, payload: any) {
    for (const action of workflow.actions) {
      switch (action.type) {
        case 'create_notification':
          await this.notificationService.create({
            tenantId: payload.tenantId,
            userId: action.config.userId,
            tipo: 'workflow',
            titulo: this.interpolate(action.config.title || workflow.name, payload),
            mensagem: this.interpolate(action.config.message || '', payload),
            link: action.config.link,
          });
          break;

        case 'send_email':
          await this.notificationService.enqueueEmail({
            to: action.config.to || '',
            subject: this.interpolate(action.config.subject || '', payload),
            template: action.config.template || 'deadline-alert',
            context: { ...payload, ...action.config.context },
          });
          break;

        case 'webhook': {
          const axios = (await import('axios')).default;
          await axios.post(action.config.url, {
            event: workflow.trigger,
            workflow: workflow.name,
            payload,
            timestamp: new Date().toISOString(),
          }, { timeout: 10000 }).catch((err) => {
            this.logger.warn(`Webhook falhou para ${action.config.url}: ${err.message}`);
          });
          break;
        }

        default:
          this.logger.warn(`Acao desconhecida: ${action.type}`);
      }
    }
  }

  /** Substitui placeholders {{campo}} por valores do payload */
  private interpolate(template: string, payload: any): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
      return this.getNestedValue(payload, path)?.toString() || '';
    });
  }
}
