import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tarefa, TarefaDocument } from './schemas/tarefa.schema';
import { CreateTarefaDto, UpdateTarefaDto } from './dto/create-tarefa.dto';
import { requireCurrentTenant } from '../tenant/tenant.context';
import { StatusTarefa } from '@contabilita/shared';

@Injectable()
export class AdministrarService {
  constructor(
    @InjectModel(Tarefa.name) private tarefaModel: Model<TarefaDocument>,
  ) {}

  async create(dto: CreateTarefaDto) {
    const ctx = requireCurrentTenant();
    return this.tarefaModel.create({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      titulo: dto.titulo,
      descricao: dto.descricao,
      prioridade: dto.prioridade,
      companyId: dto.companyId || undefined,
      prazo: dto.prazo ? new Date(dto.prazo) : undefined,
      categoria: dto.categoria,
      status: StatusTarefa.Pendente,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
  }

  async findAll(filters: { status?: string; prioridade?: string; userId?: string }) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId };
    if (filters.status) filter.status = filters.status;
    if (filters.prioridade) filter.prioridade = filters.prioridade;
    if (filters.userId) filter.userId = filters.userId;

    return this.tarefaModel.find(filter).sort({ prazo: 1, createdAt: -1 });
  }

  async update(id: string, dto: UpdateTarefaDto) {
    const ctx = requireCurrentTenant();
    const tarefa = await this.tarefaModel.findOne({
      _id: id,
      tenantId: ctx.tenantId,
    });
    if (!tarefa) throw new NotFoundException('Tarefa nao encontrada');

    if (dto.titulo !== undefined) tarefa.titulo = dto.titulo;
    if (dto.descricao !== undefined) tarefa.descricao = dto.descricao;
    if (dto.prioridade !== undefined) tarefa.prioridade = dto.prioridade;
    if (dto.companyId !== undefined) tarefa.companyId = dto.companyId as any;
    if (dto.prazo !== undefined) tarefa.prazo = new Date(dto.prazo);
    if (dto.categoria !== undefined) tarefa.categoria = dto.categoria;
    tarefa.updatedBy = ctx.userId as any;

    return tarefa.save();
  }

  async complete(id: string) {
    const ctx = requireCurrentTenant();
    const tarefa = await this.tarefaModel.findOne({
      _id: id,
      tenantId: ctx.tenantId,
    });
    if (!tarefa) throw new NotFoundException('Tarefa nao encontrada');

    tarefa.status = StatusTarefa.Concluida;
    tarefa.dataConclusao = new Date();
    tarefa.updatedBy = ctx.userId as any;

    return tarefa.save();
  }

  /** Produtividade: tarefas concluidas por usuario no mes */
  async getProductivity(year: number, month: number) {
    const ctx = requireCurrentTenant();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const result = await this.tarefaModel.aggregate([
      {
        $match: {
          tenantId: ctx.tenantId,
          status: StatusTarefa.Concluida,
          dataConclusao: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalConcluidas: { $sum: 1 },
        },
      },
      {
        $project: {
          userId: '$_id',
          totalConcluidas: 1,
          _id: 0,
        },
      },
    ]);

    return result;
  }
}
