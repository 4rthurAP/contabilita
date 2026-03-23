import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model } from 'mongoose';
import { Queue } from 'bullmq';
import { Cron } from '@nestjs/schedule';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { Company } from '../company/schemas/company.schema';
import { Certificate, CertificateStatus } from '../certificate/schemas/certificate.schema';
import { BuscaNfeLog, BuscaNfeLogDocument } from './schemas/busca-nfe-log.schema';
import type { NfeDistributionJobData } from './processors/nfe-distribution.processor';

/**
 * Scheduler para busca automatica de NF-e na SEFAZ.
 * Roda a cada 4 horas para todas as empresas com certificado A1 ativo.
 */
@Injectable()
export class BuscaNfeScheduler {
  private readonly logger = new Logger(BuscaNfeScheduler.name);

  constructor(
    @InjectModel(Company.name) private companyModel: Model<any>,
    @InjectModel(Certificate.name) private certModel: Model<any>,
    @InjectModel(BuscaNfeLog.name) private logModel: Model<BuscaNfeLogDocument>,
    @InjectQueue(QUEUE_NAMES.NFE_DISTRIBUTION) private dfeQueue: Queue<NfeDistributionJobData>,
  ) {}

  @Cron('0 */4 * * *')
  async handleDfeDistribution() {
    this.logger.log('Iniciando busca automatica de DFe...');

    // Buscar empresas que possuem certificado valido
    const validCerts = await this.certModel.find({
      status: { $in: [CertificateStatus.Valido, CertificateStatus.Expirando] },
    }).select('tenantId companyId');

    const companyIds = [...new Set(validCerts.map((c) => c.companyId.toString()))];

    if (companyIds.length === 0) {
      this.logger.log('Nenhuma empresa com certificado ativo encontrada');
      return;
    }

    const companies = await this.companyModel.find({
      _id: { $in: companyIds },
      isActive: true,
    });

    let enqueued = 0;

    for (const company of companies) {
      if (!company.cnpj) continue;

      // Buscar ultimo NSU processado
      const lastLog = await this.logModel
        .findOne({
          companyId: company._id,
          ultimoNSU: { $exists: true, $ne: null },
        })
        .sort({ dataConsulta: -1 });

      await this.dfeQueue.add(
        'dfe-auto-fetch',
        {
          tenantContext: {
            tenantId: company.tenantId.toString(),
            userId: 'system',
            role: 'Admin',
          },
          companyId: company._id.toString(),
          cnpj: company.cnpj.replace(/\D/g, ''),
          ultimoNSU: lastLog?.ultimoNSU || '0',
        },
        {
          // Evitar jobs duplicados para a mesma empresa
          jobId: `dfe-${company._id}-${new Date().toISOString().slice(0, 13)}`,
        },
      );
      enqueued++;
    }

    this.logger.log(`DFe: ${enqueued} empresas enfileiradas para busca`);
  }
}
