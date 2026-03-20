import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Registro, RegistroDocument } from './schemas/registro.schema';
import { AtividadeRegistro, AtividadeRegistroDocument } from './schemas/atividade-registro.schema';
import { CreateRegistroDto, CreateAtividadeRegistroDto } from './dto/create-registro.dto';
import { requireCurrentTenant } from '../tenant/tenant.context';
import { StatusRegistro } from '@contabilita/shared';

@Injectable()
export class RegistroService {
  constructor(
    @InjectModel(Registro.name) private registroModel: Model<RegistroDocument>,
    @InjectModel(AtividadeRegistro.name) private atividadeModel: Model<AtividadeRegistroDocument>,
  ) {}

  async create(companyId: string, dto: CreateRegistroDto) {
    const ctx = requireCurrentTenant();
    return this.registroModel.create({
      tenantId: ctx.tenantId,
      companyId,
      tipo: dto.tipo,
      observacoes: dto.observacoes,
      status: StatusRegistro.Rascunho,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
  }

  async findAll(companyId: string, status?: string) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, companyId };
    if (status) filter.status = status;

    return this.registroModel.find(filter).sort({ createdAt: -1 });
  }

  async findOne(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const registro = await this.registroModel.findOne({
      _id: id,
      tenantId: ctx.tenantId,
      companyId,
    });
    if (!registro) throw new NotFoundException('Registro nao encontrado');

    const atividades = await this.atividadeModel.find({
      tenantId: ctx.tenantId,
      registroId: id,
    }).sort({ createdAt: -1 });

    return { registro, atividades };
  }

  async updateStatus(companyId: string, id: string, status: StatusRegistro) {
    const ctx = requireCurrentTenant();
    const registro = await this.registroModel.findOne({
      _id: id,
      tenantId: ctx.tenantId,
      companyId,
    });
    if (!registro) throw new NotFoundException('Registro nao encontrado');

    registro.status = status;
    if (status === StatusRegistro.Protocolado) {
      registro.dataProtocolo = new Date();
    }
    registro.updatedBy = ctx.userId as any;
    return registro.save();
  }

  // ── Atividades ────────────────────────────────

  async addAtividade(companyId: string, registroId: string, dto: CreateAtividadeRegistroDto) {
    const ctx = requireCurrentTenant();

    // Verificar se o registro existe
    const registro = await this.registroModel.findOne({
      _id: registroId,
      tenantId: ctx.tenantId,
      companyId,
    });
    if (!registro) throw new NotFoundException('Registro nao encontrado');

    return this.atividadeModel.create({
      tenantId: ctx.tenantId,
      registroId,
      descricao: dto.descricao,
      responsavel: dto.responsavel,
      prazo: dto.prazo ? new Date(dto.prazo) : undefined,
      concluida: false,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
  }

  async toggleAtividade(companyId: string, registroId: string, atividadeId: string) {
    const ctx = requireCurrentTenant();
    const atividade = await this.atividadeModel.findOne({
      _id: atividadeId,
      tenantId: ctx.tenantId,
      registroId,
    });
    if (!atividade) throw new NotFoundException('Atividade nao encontrada');

    atividade.concluida = !atividade.concluida;
    atividade.updatedBy = ctx.userId as any;
    return atividade.save();
  }

  async deleteAtividade(companyId: string, registroId: string, atividadeId: string) {
    const ctx = requireCurrentTenant();
    const atividade = await this.atividadeModel.findOne({
      _id: atividadeId,
      tenantId: ctx.tenantId,
      registroId,
    });
    if (!atividade) throw new NotFoundException('Atividade nao encontrada');

    await this.atividadeModel.deleteOne({ _id: atividadeId });
    return { deleted: true };
  }
}
