import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TimeEntry, TimeEntryDocument } from './schemas/time-entry.schema';
import { CustoFixo, CustoFixoDocument } from './schemas/custo-fixo.schema';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { CreateCustoFixoDto } from './dto/create-custo-fixo.dto';
import { requireCurrentTenant } from '../tenant/tenant.context';

@Injectable()
export class CustosService {
  constructor(
    @InjectModel(TimeEntry.name) private timeEntryModel: Model<TimeEntryDocument>,
    @InjectModel(CustoFixo.name) private custoFixoModel: Model<CustoFixoDocument>,
  ) {}

  // ── Time Entries ────────────────────────────────

  async createTimeEntry(dto: CreateTimeEntryDto) {
    const ctx = requireCurrentTenant();
    return this.timeEntryModel.create({
      ...dto,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      data: new Date(dto.data),
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
  }

  async findTimeEntries(companyId?: string, month?: string) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId };
    if (companyId) filter.companyId = companyId;

    if (month) {
      // month format: YYYY-MM
      const [year, m] = month.split('-').map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 1);
      filter.data = { $gte: start, $lt: end };
    }

    return this.timeEntryModel.find(filter).sort({ data: -1 });
  }

  // ── Custos Fixos ────────────────────────────────

  async createCustoFixo(dto: CreateCustoFixoDto) {
    const ctx = requireCurrentTenant();
    return this.custoFixoModel.create({
      ...dto,
      tenantId: ctx.tenantId,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
  }

  async findCustosFixos() {
    const ctx = requireCurrentTenant();
    return this.custoFixoModel.find({ tenantId: ctx.tenantId }).sort({ tipo: 1, descricao: 1 });
  }

  // ── Analise de Custos ────────────────────────────

  async analyze(year: number, month: number) {
    const ctx = requireCurrentTenant();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    // Horas por empresa no periodo
    const horasPorEmpresa = await this.timeEntryModel.aggregate([
      {
        $match: {
          tenantId: ctx.tenantId,
          data: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: '$companyId',
          totalMinutos: { $sum: '$duracao' },
          lancamentos: { $sum: 1 },
        },
      },
      { $sort: { totalMinutos: -1 } },
    ]);

    const totalMinutos = horasPorEmpresa.reduce((acc: number, h: any) => acc + h.totalMinutos, 0);

    // Custos fixos totais
    const custosFixos = await this.custoFixoModel.find({ tenantId: ctx.tenantId });
    const totalCustoFixo = custosFixos.reduce((acc: number, c: any) => {
      return acc + parseFloat(c.valorMensal?.toString() || '0');
    }, 0);

    // Alocacao proporcional por empresa
    const alocacao = horasPorEmpresa.map((h: any) => {
      const proporcao = totalMinutos > 0 ? h.totalMinutos / totalMinutos : 0;
      return {
        companyId: h._id,
        totalMinutos: h.totalMinutos,
        totalHoras: Number((h.totalMinutos / 60).toFixed(2)),
        lancamentos: h.lancamentos,
        proporcao: Number(proporcao.toFixed(4)),
        custoAlocado: Number((totalCustoFixo * proporcao).toFixed(2)),
      };
    });

    return {
      periodo: { year, month },
      totalMinutos,
      totalHoras: Number((totalMinutos / 60).toFixed(2)),
      totalCustoFixo: Number(totalCustoFixo.toFixed(2)),
      empresas: alocacao,
    };
  }
}
