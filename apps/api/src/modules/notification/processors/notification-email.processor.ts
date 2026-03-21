import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../queue/queue.constants';

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

@Processor(QUEUE_NAMES.NOTIFICATION_EMAIL)
export class NotificationEmailProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationEmailProcessor.name);

  constructor(private readonly mailerService: MailerService) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    const { to, subject, template, context } = job.data;
    this.logger.log(`Enviando email para ${to}: ${subject}`);

    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context: {
          ...context,
          baseUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
        },
      });
      this.logger.log(`Email enviado com sucesso para ${to}`);
    } catch (error) {
      this.logger.error(`Falha ao enviar email para ${to}: ${error.message}`);
      throw error; // BullMQ fara retry automatico
    }
  }
}
