import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Decimal from 'decimal.js';
import { StatusContrato, StatusCobranca } from '@contabilita/shared';
import { Contrato, ContratoDocument } from '../schemas/contrato.schema';
import { Cobranca, CobrancaDocument } from '../schemas/cobranca.schema';
import { CreateContratoDto } from '../dto/create-contrato.dto';
import { requireCurrentTenant } from '../../tenant/tenant.context';

@Injectable()
export class ContratoService {
  constructor(
    @InjectModel(Contrato.name) private contratoModel: Model<ContratoDocument>,
    @InjectModel(Cobranca.name) private cobrancaModel: Model<CobrancaDocument>,
  ) {}

  async create(companyId: string, dto: CreateContratoDto) {
    const ctx = requireCurrentTenant();
    return this.contratoModel.create({
      ...dto,
      tenantId: ctx.tenantId,
      companyId,
      dataInicio: new Date(dto.dataInicio),
      dataFim: dto.dataFim ? new Date(dto.dataFim) : undefined,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
  }

  async findAll(companyId: string, status?: string) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, companyId };
    if (status) filter.status = status;
    return this.contratoModel.find(filter).sort({ descricao: 1 });
  }

  async findOne(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const contrato = await this.contratoModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!contrato) throw new NotFoundException('Contrato nao encontrado');
    return contrato;
  }

  async update(companyId: string, id: string, dto: Partial<CreateContratoDto>) {
    const ctx = requireCurrentTenant();
    const contrato = await this.contratoModel.findOneAndUpdate(
      { _id: id, tenantId: ctx.tenantId, companyId },
      { ...dto, updatedBy: ctx.userId },
      { new: true },
    );
    if (!contrato) throw new NotFoundException('Contrato nao encontrado');
    return contrato;
  }

  async remove(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const contrato = await this.contratoModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!contrato) throw new NotFoundException('Contrato nao encontrado');
    contrato.status = StatusContrato.Cancelado;
    return contrato.save();
  }

  /**
   * Gera cobrancas mensais para todos os contratos ativos de uma empresa.
   */
  async gerarCobrancasMensais(companyId: string, year: number, month: number) {
    const ctx = requireCurrentTenant();
    const competencia = `${year}/${String(month).padStart(2, '0')}`;

    const contratos = await this.contratoModel.find({
      tenantId: ctx.tenantId,
      companyId,
      status: StatusContrato.Ativo,
      dataInicio: { $lte: new Date(year, month - 1, 28) },
      $or: [
        { dataFim: null },
        { dataFim: { $exists: false } },
        { dataFim: { $gte: new Date(year, month - 1, 1) } },
      ],
    });

    const results = [];

    for (const contrato of contratos) {
      // Verifica se ja existe cobranca para esta competencia
      const existing = await this.cobrancaModel.findOne({
        tenantId: ctx.tenantId,
        companyId,
        contratoId: contrato._id,
        competencia,
      });
      if (existing) continue;

      const valorMensal = new Decimal(contrato.valorMensal.toString());
      const dataVencimento = new Date(year, month - 1, contrato.diaVencimento);

      const cobranca = await this.cobrancaModel.create({
        tenantId: ctx.tenantId,
        companyId,
        contratoId: contrato._id,
        competencia,
        dataVencimento,
        valorPrincipal: valorMensal.toString(),
        valorDesconto: '0',
        valorJuros: '0',
        valorTotal: valorMensal.toString(),
        status: StatusCobranca.Pendente,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      });

      results.push(cobranca);
    }

    return {
      competencia,
      totalContratos: contratos.length,
      cobrancasGeradas: results.length,
      results,
    };
  }
}
