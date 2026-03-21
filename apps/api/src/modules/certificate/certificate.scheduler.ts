import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CertificateService } from './certificate.service';

@Injectable()
export class CertificateScheduler {
  private readonly logger = new Logger(CertificateScheduler.name);

  constructor(private readonly certService: CertificateService) {}

  /** Verifica certificados expirando/expirados diariamente as 7h */
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async handleExpirationCheck() {
    this.logger.log('Verificando expiracao de certificados digitais...');
    await this.certService.checkExpirations();
    this.logger.log('Verificacao de certificados concluida');
  }
}
