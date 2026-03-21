import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model } from 'mongoose';
import { Queue } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { Obligation } from '../obligations/schemas/obligation.schema';
import { TaxPayment } from '../fiscal/schemas/tax-payment.schema';
import { requireCurrentTenant } from '../tenant/tenant.context';
import { QUEUE_NAMES } from '../queue/queue.constants';
import type { EmailJobData } from './processors/notification-email.processor';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name) private notifModel: Model<NotificationDocument>,
    @InjectModel('Obligation') private obligationModel: Model<any>,
    @InjectModel('TaxPayment') private paymentModel: Model<any>,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION_EMAIL) private emailQueue: Queue<EmailJobData>,
  ) {}

  async getForUser(userId: string, onlyUnread = false) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, userId };
    if (onlyUnread) filter.lida = false;

    return this.notifModel.find(filter).sort({ createdAt: -1 }).limit(50);
  }

  async markAsRead(userId: string, id: string) {
    return this.notifModel.findOneAndUpdate(
      { _id: id, userId },
      { lida: true },
      { new: true },
    );
  }

  async markAllAsRead(userId: string) {
    const ctx = requireCurrentTenant();
    return this.notifModel.updateMany(
      { tenantId: ctx.tenantId, userId, lida: false },
      { lida: true },
    );
  }

  async create(params: {
    tenantId: string;
    userId?: string;
    tipo: string;
    titulo: string;
    mensagem: string;
    link?: string;
    dataReferencia?: Date;
  }) {
    return this.notifModel.create(params);
  }

  /** Enfileira um email para envio assincrono */
  async enqueueEmail(data: EmailJobData) {
    await this.emailQueue.add('send-email', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10000 },
    });
  }

  /** Gera notificacoes de prazos proximos (roda diariamente) */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkUpcomingDeadlines() {
    const today = new Date();
    const in7days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Obrigacoes com prazo nos proximos 7 dias
    const obligations = await this.obligationModel.find({
      status: 'pendente',
      prazoEntrega: { $gte: today, $lte: in7days },
    });

    let obligationCount = 0;
    for (const obl of obligations) {
      const existing = await this.notifModel.findOne({
        tenantId: obl.tenantId,
        tipo: 'prazo_fiscal',
        dataReferencia: obl.prazoEntrega,
        mensagem: { $regex: obl.tipo },
      });
      if (existing) continue;

      const daysLeft = Math.ceil(
        (obl.prazoEntrega.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
      );

      await this.notifModel.create({
        tenantId: obl.tenantId,
        tipo: 'prazo_fiscal',
        titulo: `Prazo proximo: ${obl.tipo}`,
        mensagem: `A obrigacao ${obl.tipo} (${obl.competencia}) vence em breve.`,
        link: '/obligations',
        dataReferencia: obl.prazoEntrega,
      });

      // Enfileira email de alerta
      await this.enqueueEmail({
        to: '', // Sera preenchido pelo processor ao buscar usuarios do tenant
        subject: `[Contabilita] Prazo proximo: ${obl.tipo}`,
        template: 'deadline-alert',
        context: {
          titulo: `Prazo proximo: ${obl.tipo}`,
          mensagem: `A obrigacao ${obl.tipo} (${obl.competencia}) vence em breve.`,
          prazo: obl.prazoEntrega.toLocaleDateString('pt-BR'),
          diasRestantes: daysLeft,
          competencia: obl.competencia,
          isUrgent: daysLeft <= 3,
          link: '/obligations',
        },
      });

      obligationCount++;
    }

    // Guias vencendo nos proximos 7 dias
    const payments = await this.paymentModel.find({
      status: 'pendente',
      dataVencimento: { $gte: today, $lte: in7days },
    });

    let paymentCount = 0;
    for (const pay of payments) {
      const existing = await this.notifModel.findOne({
        tenantId: pay.tenantId,
        tipo: 'vencimento_guia',
        dataReferencia: pay.dataVencimento,
        mensagem: { $regex: pay.tipo },
      });
      if (existing) continue;

      await this.notifModel.create({
        tenantId: pay.tenantId,
        tipo: 'vencimento_guia',
        titulo: `Guia vencendo: ${pay.tipoGuia} ${pay.tipo.toUpperCase()}`,
        mensagem: `A guia de ${pay.competencia} vence em breve.`,
        link: '/fiscal/payments',
        dataReferencia: pay.dataVencimento,
      });

      const valorStr = pay.valorTotal?.$numberDecimal ?? pay.valorTotal?.toString() ?? '0';
      await this.enqueueEmail({
        to: '',
        subject: `[Contabilita] Guia vencendo: ${pay.tipoGuia} ${pay.tipo}`,
        template: 'payment-due',
        context: {
          mensagem: `A guia de ${pay.competencia} vence em breve.`,
          tipoGuia: pay.tipoGuia,
          tipo: pay.tipo,
          competencia: pay.competencia,
          vencimento: pay.dataVencimento.toLocaleDateString('pt-BR'),
          valor: valorStr,
          link: '/fiscal/payments',
        },
      });

      paymentCount++;
    }

    if (obligationCount || paymentCount) {
      this.logger.log(
        `Notificacoes geradas: ${obligationCount} obrigacoes, ${paymentCount} guias`,
      );
    }
  }
}
