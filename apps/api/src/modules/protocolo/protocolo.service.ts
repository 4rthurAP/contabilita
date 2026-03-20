import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Protocolo, ProtocoloDocument } from './schemas/protocolo.schema';
import { CreateProtocoloDto } from './dto/create-protocolo.dto';
import { UpdateProtocoloStatusDto } from './dto/update-status.dto';
import { requireCurrentTenant } from '../tenant/tenant.context';

@Injectable()
export class ProtocoloService {
  constructor(
    @InjectModel(Protocolo.name) private protocoloModel: Model<ProtocoloDocument>,
  ) {}

  /**
   * Gera numero sequencial no formato PROT-YYYY-NNNN
   */
  private async generateNumero(companyId: string): Promise<string> {
    const ctx = requireCurrentTenant();
    const year = new Date().getFullYear();
    const prefix = `PROT-${year}-`;

    const last = await this.protocoloModel
      .findOne({
        tenantId: ctx.tenantId,
        companyId,
        numero: { $regex: `^${prefix}` },
      })
      .sort({ numero: -1 });

    let seq = 1;
    if (last) {
      const lastSeq = parseInt(last.numero.replace(prefix, ''), 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}${seq.toString().padStart(4, '0')}`;
  }

  async create(companyId: string, dto: CreateProtocoloDto) {
    const ctx = requireCurrentTenant();
    const numero = await this.generateNumero(companyId);

    return this.protocoloModel.create({
      ...dto,
      tenantId: ctx.tenantId,
      companyId,
      numero,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
  }

  async findAll(companyId: string, status?: string, tipo?: string) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, companyId };
    if (status) filter.status = status;
    if (tipo) filter.tipo = tipo;

    return this.protocoloModel.find(filter).sort({ dataRegistro: -1 });
  }

  async findById(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const protocolo = await this.protocoloModel.findOne({
      _id: id,
      tenantId: ctx.tenantId,
      companyId,
    });
    if (!protocolo) throw new NotFoundException('Protocolo nao encontrado');
    return protocolo;
  }

  async updateStatus(companyId: string, id: string, dto: UpdateProtocoloStatusDto) {
    const ctx = requireCurrentTenant();
    const update: any = { status: dto.status, updatedBy: ctx.userId };
    if (dto.observacoes) update.observacoes = dto.observacoes;

    const protocolo = await this.protocoloModel.findOneAndUpdate(
      { _id: id, tenantId: ctx.tenantId, companyId },
      update,
      { new: true },
    );
    if (!protocolo) throw new NotFoundException('Protocolo nao encontrado');
    return protocolo;
  }
}
