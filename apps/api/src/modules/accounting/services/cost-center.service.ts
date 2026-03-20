import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CostCenter, CostCenterDocument } from '../schemas/cost-center.schema';
import { CreateCostCenterDto } from '../dto/create-cost-center.dto';
import { requireCurrentTenant } from '../../tenant/tenant.context';

@Injectable()
export class CostCenterService {
  constructor(
    @InjectModel(CostCenter.name) private costCenterModel: Model<CostCenterDocument>,
  ) {}

  async create(companyId: string, dto: CreateCostCenterDto) {
    const ctx = requireCurrentTenant();

    const existing = await this.costCenterModel.findOne({
      tenantId: ctx.tenantId,
      companyId,
      codigo: dto.codigo,
    });
    if (existing) {
      throw new ConflictException(`Centro de custo ${dto.codigo} ja existe`);
    }

    return this.costCenterModel.create({
      ...dto,
      tenantId: ctx.tenantId,
      companyId,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
  }

  async findAll(companyId: string) {
    const ctx = requireCurrentTenant();
    return this.costCenterModel
      .find({ tenantId: ctx.tenantId, companyId })
      .sort({ codigo: 1 });
  }

  async findById(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const cc = await this.costCenterModel.findOne({
      _id: id,
      tenantId: ctx.tenantId,
      companyId,
    });
    if (!cc) throw new NotFoundException('Centro de custo nao encontrado');
    return cc;
  }

  async update(companyId: string, id: string, dto: Partial<CreateCostCenterDto>) {
    const ctx = requireCurrentTenant();
    const cc = await this.costCenterModel.findOneAndUpdate(
      { _id: id, tenantId: ctx.tenantId, companyId },
      { ...dto, updatedBy: ctx.userId },
      { new: true },
    );
    if (!cc) throw new NotFoundException('Centro de custo nao encontrado');
    return cc;
  }

  async remove(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const cc = await this.costCenterModel.findOne({
      _id: id,
      tenantId: ctx.tenantId,
      companyId,
    });
    if (!cc) throw new NotFoundException('Centro de custo nao encontrado');
    cc.deletedAt = new Date();
    return cc.save();
  }
}
