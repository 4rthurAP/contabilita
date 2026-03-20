import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from './schemas/tenant.schema';
import { TenantUser, TenantUserDocument } from './schemas/tenant-user.schema';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantRole } from '@contabilita/shared';

@Injectable()
export class TenantService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(TenantUser.name) private tenantUserModel: Model<TenantUserDocument>,
  ) {}

  async create(dto: CreateTenantDto, userId: string) {
    if (!this.isValidCnpj(dto.cnpj)) {
      throw new BadRequestException('CNPJ invalido');
    }

    const existing = await this.tenantModel.findOne({
      $or: [{ slug: dto.slug }, { cnpj: dto.cnpj }],
    });
    if (existing) {
      throw new ConflictException('Slug ou CNPJ ja cadastrado');
    }

    const tenant = await this.tenantModel.create(dto);

    // Criar vinculo owner automaticamente
    await this.tenantUserModel.create({
      tenantId: tenant._id,
      userId,
      role: TenantRole.Owner,
      isActive: true,
    });

    return tenant;
  }

  async findUserTenants(userId: string) {
    const tenantUsers = await this.tenantUserModel
      .find({ userId, isActive: true })
      .populate('tenantId');

    return tenantUsers.map((tu) => ({
      tenant: tu.tenantId,
      role: tu.role,
    }));
  }

  async findById(tenantId: string) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Escritorio nao encontrado');
    }
    return tenant;
  }

  async getMembers(tenantId: string) {
    return this.tenantUserModel
      .find({ tenantId, isActive: true })
      .populate('userId', 'name email cpf');
  }

  async addMember(tenantId: string, userId: string, role: TenantRole) {
    const existing = await this.tenantUserModel.findOne({ tenantId, userId });
    if (existing) {
      throw new ConflictException('Usuario ja vinculado a este escritorio');
    }

    return this.tenantUserModel.create({ tenantId, userId, role, isActive: true });
  }

  /** Validacao de CNPJ com digitos verificadores */
  private isValidCnpj(cnpj: string): boolean {
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(cnpj[i]) * weights1[i];
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(cnpj[12]) !== digit1) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) sum += parseInt(cnpj[i]) * weights2[i];
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    return parseInt(cnpj[13]) === digit2;
  }
}
