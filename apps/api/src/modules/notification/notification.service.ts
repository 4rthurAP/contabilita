import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { Obligation } from '../obligations/schemas/obligation.schema';
import { TaxPayment } from '../fiscal/schemas/tax-payment.schema';
import { requireCurrentTenant, getCurrentTenant } from '../tenant/tenant.context';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notifModel: Model<NotificationDocument>,
    @InjectModel('Obligation') private obligationModel: Model<any>,
    @InjectModel('TaxPayment') private paymentModel: Model<any>,
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

    for (const obl of obligations) {
      const existing = await this.notifModel.findOne({
        tenantId: obl.tenantId,
        tipo: 'prazo_fiscal',
        dataReferencia: obl.prazoEntrega,
        mensagem: { $regex: obl.tipo },
      });
      if (existing) continue;

      await this.notifModel.create({
        tenantId: obl.tenantId,
        tipo: 'prazo_fiscal',
        titulo: `Prazo proximo: ${obl.tipo}`,
        mensagem: `A obrigacao ${obl.tipo} (${obl.competencia}) vence em breve.`,
        link: '/obligations',
        dataReferencia: obl.prazoEntrega,
      });
    }

    // Guias vencendo nos proximos 7 dias
    const payments = await this.paymentModel.find({
      status: 'pendente',
      dataVencimento: { $gte: today, $lte: in7days },
    });

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
    }
  }
}
