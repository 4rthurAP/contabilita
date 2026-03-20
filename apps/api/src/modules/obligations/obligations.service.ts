import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Obligation, ObligationDocument } from './schemas/obligation.schema';
import { SpedEcdGenerator } from './generators/sped-ecd.generator';
import { SpedEfdGenerator } from './generators/sped-efd.generator';
import { requireCurrentTenant } from '../tenant/tenant.context';

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
  constructor(
    @InjectModel(Obligation.name) private obligationModel: Model<ObligationDocument>,
    private ecdGenerator: SpedEcdGenerator,
    private efdGenerator: SpedEfdGenerator,
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

  /** Gera arquivo SPED ECD */
  async generateEcd(companyId: string, year: number) {
    const ctx = requireCurrentTenant();
    const content = await this.ecdGenerator.generate(ctx.tenantId, companyId, year);
    const fileName = `ECD_${year}.txt`;

    await this.obligationModel.findOneAndUpdate(
      { tenantId: ctx.tenantId, companyId, tipo: 'ECD', competencia: String(year) },
      { status: 'gerada', fileName, fileContent: content, updatedBy: ctx.userId },
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

    await this.obligationModel.findOneAndUpdate(
      { tenantId: ctx.tenantId, companyId, tipo: 'EFD', competencia },
      { status: 'gerada', fileName, fileContent: content, updatedBy: ctx.userId },
      { upsert: true, new: true },
    );

    return { fileName, lines: content.split('\r\n').length, size: content.length };
  }

  /** Download do arquivo gerado */
  async downloadFile(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const obl = await this.obligationModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!obl) throw new NotFoundException('Obrigacao nao encontrada');
    if (!obl.fileContent) throw new BadRequestException('Arquivo ainda nao foi gerado');

    return { fileName: obl.fileName, content: obl.fileContent };
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
