import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountingPeriod, AccountingPeriodDocument } from '../schemas/accounting-period.schema';
import { requireCurrentTenant } from '../../tenant/tenant.context';
import { StatusPeriodo } from '@contabilita/shared';

@Injectable()
export class AccountingPeriodService {
  constructor(
    @InjectModel(AccountingPeriod.name)
    private periodModel: Model<AccountingPeriodDocument>,
  ) {}

  async findAll(companyId: string, year?: number) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, companyId };
    if (year) filter.year = year;

    return this.periodModel.find(filter).sort({ year: -1, month: -1 });
  }

  async openPeriod(companyId: string, year: number, month: number) {
    const ctx = requireCurrentTenant();

    const existing = await this.periodModel.findOne({
      tenantId: ctx.tenantId,
      companyId,
      year,
      month,
    });
    if (existing) {
      throw new BadRequestException(`Periodo ${month}/${year} ja existe`);
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Ultimo dia do mes

    return this.periodModel.create({
      tenantId: ctx.tenantId,
      companyId,
      year,
      month,
      status: StatusPeriodo.Aberto,
      startDate,
      endDate,
    });
  }

  async closePeriod(companyId: string, id: string) {
    const ctx = requireCurrentTenant();

    const period = await this.periodModel.findOne({
      _id: id,
      tenantId: ctx.tenantId,
      companyId,
    });
    if (!period) throw new NotFoundException('Periodo nao encontrado');

    if (period.status === StatusPeriodo.Fechado) {
      throw new BadRequestException('Periodo ja esta fechado');
    }

    period.status = StatusPeriodo.Fechado;
    period.closedAt = new Date();
    period.closedBy = ctx.userId as any;
    return period.save();
  }

  async reopenPeriod(companyId: string, id: string) {
    const ctx = requireCurrentTenant();

    const period = await this.periodModel.findOne({
      _id: id,
      tenantId: ctx.tenantId,
      companyId,
    });
    if (!period) throw new NotFoundException('Periodo nao encontrado');

    if (period.status !== StatusPeriodo.Fechado) {
      throw new BadRequestException('Periodo nao esta fechado');
    }

    period.status = StatusPeriodo.Aberto;
    period.closedAt = undefined as any;
    period.closedBy = undefined as any;
    return period.save();
  }
}
