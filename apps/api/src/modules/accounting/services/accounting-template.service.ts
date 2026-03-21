import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountingTemplate, AccountingTemplateDocument } from '../schemas/accounting-template.schema';
import { requireCurrentTenant } from '../../tenant/tenant.context';

@Injectable()
export class AccountingTemplateService {
  constructor(
    @InjectModel(AccountingTemplate.name) private templateModel: Model<AccountingTemplateDocument>,
  ) {}

  async create(companyId: string, data: Partial<AccountingTemplate>) {
    const ctx = requireCurrentTenant();
    return this.templateModel.create({
      ...data,
      tenantId: ctx.tenantId,
      companyId,
      createdBy: ctx.userId,
    });
  }

  async findAll(companyId: string) {
    const ctx = requireCurrentTenant();
    return this.templateModel
      .find({ tenantId: ctx.tenantId, companyId, isActive: true })
      .sort({ prioridade: -1, cfop: 1 });
  }

  async findById(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const template = await this.templateModel.findOne({
      _id: id,
      tenantId: ctx.tenantId,
      companyId,
    });
    if (!template) throw new NotFoundException('Template nao encontrado');
    return template;
  }

  async update(companyId: string, id: string, data: Partial<AccountingTemplate>) {
    const ctx = requireCurrentTenant();
    const template = await this.templateModel.findOneAndUpdate(
      { _id: id, tenantId: ctx.tenantId, companyId },
      { ...data, updatedBy: ctx.userId },
      { new: true },
    );
    if (!template) throw new NotFoundException('Template nao encontrado');
    return template;
  }

  async remove(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const template = await this.templateModel.findOne({
      _id: id,
      tenantId: ctx.tenantId,
      companyId,
    });
    if (!template) throw new NotFoundException('Template nao encontrado');
    template.isActive = false;
    return template.save();
  }

  /**
   * Busca o template mais especifico para uma combinacao de tipo de nota e CFOPs.
   * Prioridade: template com CFOP especifico > template generico.
   */
  async findBestMatch(
    tenantId: string,
    companyId: string,
    tipoNota: string,
    cfops: string[],
  ): Promise<AccountingTemplate | null> {
    // Tentar com CFOP especifico primeiro
    for (const cfop of cfops) {
      const match = await this.templateModel.findOne({
        tenantId,
        companyId,
        tipoNota,
        cfop,
        isActive: true,
      }).sort({ prioridade: -1 });
      if (match) return match;
    }

    // Fallback: template generico (sem CFOP)
    return this.templateModel.findOne({
      tenantId,
      companyId,
      tipoNota,
      $or: [{ cfop: null }, { cfop: '' }, { cfop: { $exists: false } }],
      isActive: true,
    }).sort({ prioridade: -1 });
  }
}
