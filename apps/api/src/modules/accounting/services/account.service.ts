import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account, AccountDocument } from '../schemas/account.schema';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { requireCurrentTenant } from '../../tenant/tenant.context';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
  ) {}

  async create(companyId: string, dto: CreateAccountDto) {
    const ctx = requireCurrentTenant();

    const existing = await this.accountModel.findOne({
      tenantId: ctx.tenantId,
      companyId,
      codigo: dto.codigo,
    });
    if (existing) {
      throw new ConflictException(`Conta com codigo ${dto.codigo} ja existe`);
    }

    // Valida conta pai se informada
    if (dto.parentId) {
      const parent = await this.accountModel.findOne({
        _id: dto.parentId,
        tenantId: ctx.tenantId,
        companyId,
      });
      if (!parent) {
        throw new BadRequestException('Conta pai nao encontrada');
      }
      if (parent.isAnalytical) {
        throw new BadRequestException('Conta pai nao pode ser analitica');
      }
    }

    return this.accountModel.create({
      ...dto,
      tenantId: ctx.tenantId,
      companyId,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
  }

  /** Retorna plano de contas em formato tree */
  async findTree(companyId: string) {
    const ctx = requireCurrentTenant();
    const accounts = await this.accountModel
      .find({ tenantId: ctx.tenantId, companyId })
      .sort({ codigo: 1 })
      .lean();

    return this.buildTree(accounts);
  }

  /** Retorna lista plana (flat) do plano de contas */
  async findAll(companyId: string) {
    const ctx = requireCurrentTenant();
    return this.accountModel
      .find({ tenantId: ctx.tenantId, companyId })
      .sort({ codigo: 1 });
  }

  /** Retorna apenas contas analiticas (que recebem lancamentos) */
  async findAnalytical(companyId: string) {
    const ctx = requireCurrentTenant();
    return this.accountModel
      .find({ tenantId: ctx.tenantId, companyId, isAnalytical: true, isActive: true })
      .sort({ codigo: 1 });
  }

  async findById(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const account = await this.accountModel.findOne({
      _id: id,
      tenantId: ctx.tenantId,
      companyId,
    });
    if (!account) throw new NotFoundException('Conta nao encontrada');
    return account;
  }

  async update(companyId: string, id: string, dto: UpdateAccountDto) {
    const ctx = requireCurrentTenant();
    const account = await this.accountModel.findOneAndUpdate(
      { _id: id, tenantId: ctx.tenantId, companyId },
      { ...dto, updatedBy: ctx.userId },
      { new: true },
    );
    if (!account) throw new NotFoundException('Conta nao encontrada');
    return account;
  }

  async remove(companyId: string, id: string) {
    const ctx = requireCurrentTenant();

    // Verifica se tem filhos
    const children = await this.accountModel.countDocuments({
      tenantId: ctx.tenantId,
      companyId,
      parentId: id,
    });
    if (children > 0) {
      throw new BadRequestException('Nao e possivel remover conta com subcontas');
    }

    const account = await this.accountModel.findOne({
      _id: id,
      tenantId: ctx.tenantId,
      companyId,
    });
    if (!account) throw new NotFoundException('Conta nao encontrada');

    account.deletedAt = new Date();
    return account.save();
  }

  /** Constroi arvore hierarquica a partir da lista plana */
  private buildTree(accounts: any[]): any[] {
    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const acc of accounts) {
      map.set(acc._id.toString(), { ...acc, children: [] });
    }

    for (const acc of accounts) {
      const node = map.get(acc._id.toString());
      if (acc.parentId) {
        const parent = map.get(acc.parentId.toString());
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
