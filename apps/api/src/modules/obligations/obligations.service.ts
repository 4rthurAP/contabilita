import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model } from 'mongoose';
import { Queue } from 'bullmq';
import { Obligation, ObligationDocument } from './schemas/obligation.schema';
import { SpedEcdGenerator } from './generators/sped-ecd.generator';
import { SpedEfdGenerator } from './generators/sped-efd.generator';
import { SpedReinfGenerator } from './generators/sped-reinf.generator';
import { StorageService } from '../storage/storage.service';
import { requireCurrentTenant } from '../tenant/tenant.context';
import { QUEUE_NAMES } from '../queue/queue.constants';
import type { SpedTransmissionJobData } from './processors/sped-transmission.processor';

/** Prazos padrao por obrigacao (dia do mes seguinte ao periodo) */
const PRAZOS: Record<string, number> = {
  ECD: 31, // Ultimo dia util de maio do ano seguinte
  EFD: 15, // Dia 15 do mes seguinte
  EFD_REINF: 15,
  DCTFWEB: 15,
  DMED: 28, // Fevereiro do ano seguinte
  DIMOB: 28,
  DIRF: 28,
  DEFIS: 31, // Marco do ano seguinte
  DIRBI: 20,
  FGTS_DIGITAL: 7,
};

@Injectable()
export class ObligationsService {
  private readonly logger = new Logger(ObligationsService.name);

  constructor(
    @InjectModel(Obligation.name) private obligationModel: Model<ObligationDocument>,
    private ecdGenerator: SpedEcdGenerator,
    private efdGenerator: SpedEfdGenerator,
    private reinfGenerator: SpedReinfGenerator,
    private storageService: StorageService,
    @InjectQueue(QUEUE_NAMES.SPED_TRANSMISSION) private spedQueue: Queue<SpedTransmissionJobData>,
  ) {}

  async findAll(companyId: string, year?: number) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, companyId };
    if (year) {
      filter.competencia = { $regex: `/${year}$` };
    }
    return this.obligationModel.find(filter).sort({ prazoEntrega: 1 });
  }

  async findPending(companyId: string) {
    const ctx = requireCurrentTenant();
    return this.obligationModel
      .find({ tenantId: ctx.tenantId, companyId, status: { $in: ['pendente', 'gerada'] } })
      .sort({ prazoEntrega: 1 });
  }

  /** Gera obrigacoes mensais para um periodo */
  async generateMonthlyObligations(companyId: string, year: number, month: number) {
    const ctx = requireCurrentTenant();
    const monthlyTypes = ['EFD', 'EFD_REINF', 'DCTFWEB', 'FGTS_DIGITAL'];
    const competencia = `${String(month).padStart(2, '0')}/${year}`;
    const results = [];

    for (const tipo of monthlyTypes) {
      const existing = await this.obligationModel.findOne({
        tenantId: ctx.tenantId, companyId, tipo, competencia,
      });
      if (existing) continue;

      const prazoDay = PRAZOS[tipo] || 15;
      const prazoDate = new Date(year, month, prazoDay); // Mes seguinte

      const obl = await this.obligationModel.create({
        tenantId: ctx.tenantId, companyId, tipo, competencia,
        prazoEntrega: prazoDate,
        status: 'pendente',
        createdBy: ctx.userId, updatedBy: ctx.userId,
      });
      results.push(obl);
    }

    return results;
  }

  /** Gera obrigacoes anuais */
  async generateAnnualObligations(companyId: string, year: number) {
    const ctx = requireCurrentTenant();
    const annualTypes = ['ECD', 'DMED', 'DIMOB', 'DIRF', 'DEFIS'];
    const competencia = String(year);
    const results = [];

    for (const tipo of annualTypes) {
      const existing = await this.obligationModel.findOne({
        tenantId: ctx.tenantId, companyId, tipo, competencia,
      });
      if (existing) continue;

      // ECD prazo em maio, demais em fevereiro/marco do ano seguinte
      let prazoDate: Date;
      if (tipo === 'ECD') prazoDate = new Date(year + 1, 4, 31);
      else if (tipo === 'DEFIS') prazoDate = new Date(year + 1, 2, 31);
      else prazoDate = new Date(year + 1, 1, 28);

      const obl = await this.obligationModel.create({
        tenantId: ctx.tenantId, companyId, tipo, competencia,
        prazoEntrega: prazoDate,
        status: 'pendente',
        createdBy: ctx.userId, updatedBy: ctx.userId,
      });
      results.push(obl);
    }

    return results;
  }

  /** Upload de conteudo SPED para storage e retorno da key */
  private async uploadToStorage(tenantId: string, fileName: string, content: string): Promise<string> {
    const buffer = Buffer.from(content, 'utf-8');
    return this.storageService.upload(buffer, {
      tenantId,
      folder: 'sped',
      fileName,
      contentType: fileName.endsWith('.xml') ? 'application/xml' : 'text/plain',
    });
  }

  /** Gera arquivo SPED ECD */
  async generateEcd(companyId: string, year: number) {
    const ctx = requireCurrentTenant();
    const content = await this.ecdGenerator.generate(ctx.tenantId, companyId, year);
    const fileName = `ECD_${year}.txt`;
    const fileKey = await this.uploadToStorage(ctx.tenantId, fileName, content);

    await this.obligationModel.findOneAndUpdate(
      { tenantId: ctx.tenantId, companyId, tipo: 'ECD', competencia: String(year) },
      { status: 'gerada', fileName, fileKey, updatedBy: ctx.userId },
      { upsert: true, new: true },
    );

    return { fileName, lines: content.split('\r\n').length, size: content.length };
  }

  /** Gera arquivo SPED EFD */
  async generateEfd(companyId: string, year: number, month: number) {
    const ctx = requireCurrentTenant();
    const content = await this.efdGenerator.generate(ctx.tenantId, companyId, year, month);
    const competencia = `${String(month).padStart(2, '0')}/${year}`;
    const fileName = `EFD_${competencia.replace('/', '_')}.txt`;
    const fileKey = await this.uploadToStorage(ctx.tenantId, fileName, content);

    await this.obligationModel.findOneAndUpdate(
      { tenantId: ctx.tenantId, companyId, tipo: 'EFD', competencia },
      { status: 'gerada', fileName, fileKey, updatedBy: ctx.userId },
      { upsert: true, new: true },
    );

    return { fileName, lines: content.split('\r\n').length, size: content.length };
  }

  /** Gera eventos EFD-Reinf */
  async generateReinf(companyId: string, year: number, month: number) {
    const ctx = requireCurrentTenant();
    const { events, summary } = await this.reinfGenerator.generate(
      ctx.tenantId,
      companyId,
      year,
      month,
    );
    const competencia = `${String(month).padStart(2, '0')}/${year}`;
    const fileName = `REINF_${competencia.replace('/', '_')}.xml`;
    const content = events.join('\n\n');
    const fileKey = await this.uploadToStorage(ctx.tenantId, fileName, content);

    await this.obligationModel.findOneAndUpdate(
      { tenantId: ctx.tenantId, companyId, tipo: 'EFD_REINF', competencia },
      { status: 'gerada', fileName, fileKey, updatedBy: ctx.userId },
      { upsert: true, new: true },
    );

    return { fileName, eventsCount: events.length, summary };
  }

  /** Download do arquivo gerado (S3 ou legacy fileContent) */
  async downloadFile(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const obl = await this.obligationModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!obl) throw new NotFoundException('Obrigacao nao encontrada');

    // Prioriza S3, fallback para legacy fileContent
    if (obl.fileKey) {
      const buffer = await this.storageService.download(obl.fileKey);
      return { fileName: obl.fileName, content: buffer.toString('utf-8') };
    }
    if (obl.fileContent) {
      return { fileName: obl.fileName, content: obl.fileContent };
    }
    throw new BadRequestException('Arquivo ainda nao foi gerado');
  }

  /** Enfileira transmissao SPED via certificado A1 */
  async enqueueTransmission(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const obl = await this.obligationModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!obl) throw new NotFoundException('Obrigacao nao encontrada');
    if (!obl.fileKey && !obl.fileContent) throw new BadRequestException('Arquivo ainda nao foi gerado');
    if (obl.status === 'transmitida') throw new BadRequestException('Obrigacao ja transmitida');

    const job = await this.spedQueue.add('transmit-sped', {
      tenantContext: { tenantId: ctx.tenantId, userId: ctx.userId, role: ctx.role },
      companyId,
      obligationId: id,
      tipo: obl.tipo,
    });

    this.logger.log(`Transmissao SPED enfileirada: ${obl.tipo} ${obl.competencia}, job ${job.id}`);

    return { jobId: job.id, message: 'Transmissao enfileirada com sucesso' };
  }

  /** Marca como transmitida */
  async markTransmitted(companyId: string, id: string, recibo: string) {
    const ctx = requireCurrentTenant();
    const obl = await this.obligationModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!obl) throw new NotFoundException('Obrigacao nao encontrada');

    obl.status = 'transmitida';
    obl.recibo = recibo;
    obl.dataTransmissao = new Date();
    return obl.save();
  }
}
