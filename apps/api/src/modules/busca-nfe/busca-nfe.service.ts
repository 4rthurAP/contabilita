import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model } from 'mongoose';
import { Queue } from 'bullmq';
import { BuscaNfeLog, BuscaNfeLogDocument } from './schemas/busca-nfe-log.schema';
import { CertificateService } from '../certificate/certificate.service';
import { requireCurrentTenant } from '../tenant/tenant.context';
import { QUEUE_NAMES } from '../queue/queue.constants';
import type { NfeDistributionJobData } from './processors/nfe-distribution.processor';

@Injectable()
export class BuscaNfeService {
  private readonly logger = new Logger(BuscaNfeService.name);

  constructor(
    @InjectModel(BuscaNfeLog.name) private buscaNfeLogModel: Model<BuscaNfeLogDocument>,
    private readonly certificateService: CertificateService,
    @InjectQueue(QUEUE_NAMES.NFE_DISTRIBUTION) private dfeQueue: Queue<NfeDistributionJobData>,
  ) {}

  /**
   * Enfileira busca de NF-e na SEFAZ via Distribuicao DFe.
   * Requer certificado digital A1 configurado para a empresa.
   */
  async fetch(companyId: string, cnpj: string) {
    const ctx = requireCurrentTenant();

    // Verificar se a empresa possui certificado valido
    try {
      await this.certificateService.getDecryptedPfx(companyId);
    } catch {
      return {
        success: false,
        message: 'Busca de NF-e requer certificado digital A1 configurado para a empresa.',
        quantidadeEncontrada: 0,
        quantidadeImportada: 0,
      };
    }

    // Buscar ultimo NSU
    const lastLog = await this.buscaNfeLogModel
      .findOne({
        tenantId: ctx.tenantId,
        companyId,
        ultimoNSU: { $exists: true, $ne: null },
      })
      .sort({ dataConsulta: -1 });

    // Enfileirar job de distribuicao DFe
    const job = await this.dfeQueue.add('dfe-manual-fetch', {
      tenantContext: { tenantId: ctx.tenantId, userId: ctx.userId, role: ctx.role },
      companyId,
      cnpj: cnpj.replace(/\D/g, ''),
      ultimoNSU: lastLog?.ultimoNSU || '0',
    });

    this.logger.log(`DFe manual enfileirado para empresa ${companyId}, job ${job.id}`);

    return {
      success: true,
      message: 'Busca de NF-e enfileirada. Os resultados aparecerao no historico em breve.',
      jobId: job.id,
    };
  }

  async getHistory(companyId: string) {
    const ctx = requireCurrentTenant();
    return this.buscaNfeLogModel
      .find({ tenantId: ctx.tenantId, companyId })
      .sort({ dataConsulta: -1 })
      .limit(50);
  }
}
