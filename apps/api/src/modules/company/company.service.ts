import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from './schemas/company.schema';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { requireCurrentTenant } from '../tenant/tenant.context';
import { escapeRegex } from '../../common/utils/escape-regex.util';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async create(dto: CreateCompanyDto) {
    const ctx = requireCurrentTenant();

    if (!this.isValidCnpj(dto.cnpj)) {
      throw new BadRequestException('CNPJ invalido');
    }

    const existing = await this.companyModel.findOne({
      tenantId: ctx.tenantId,
      cnpj: dto.cnpj,
    });
    if (existing) {
      throw new ConflictException('CNPJ ja cadastrado neste escritorio');
    }

    return this.companyModel.create({
      ...dto,
      tenantId: ctx.tenantId,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId };

    if (search) {
      const escaped = escapeRegex(search);
      filter.$or = [
        { razaoSocial: { $regex: escaped, $options: 'i' } },
        { nomeFantasia: { $regex: escaped, $options: 'i' } },
        { cnpj: { $regex: escaped } },
      ];
    }

    const [data, total] = await Promise.all([
      this.companyModel
        .find(filter)
        .sort({ razaoSocial: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.companyModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const ctx = requireCurrentTenant();
    const company = await this.companyModel.findOne({ _id: id, tenantId: ctx.tenantId });
    if (!company) {
      throw new NotFoundException('Empresa nao encontrada');
    }
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    const ctx = requireCurrentTenant();
    const company = await this.companyModel.findOneAndUpdate(
      { _id: id, tenantId: ctx.tenantId },
      { ...dto, updatedBy: ctx.userId },
      { new: true },
    );
    if (!company) {
      throw new NotFoundException('Empresa nao encontrada');
    }
    return company;
  }

  async remove(id: string) {
    const ctx = requireCurrentTenant();
    const company = await this.companyModel.findOne({ _id: id, tenantId: ctx.tenantId });
    if (!company) {
      throw new NotFoundException('Empresa nao encontrada');
    }
    // Soft delete via plugin
    company.deletedAt = new Date();
    return company.save();
  }

  /** Validacao de CNPJ com digitos verificadores */
  private isValidCnpj(cnpj: string): boolean {
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let s = 0;
    for (let i = 0; i < 12; i++) s += parseInt(cnpj[i]) * w1[i];
    let r = s % 11;
    if (parseInt(cnpj[12]) !== (r < 2 ? 0 : 11 - r)) return false;
    s = 0;
    for (let i = 0; i < 13; i++) s += parseInt(cnpj[i]) * w2[i];
    r = s % 11;
    return parseInt(cnpj[13]) === (r < 2 ? 0 : 11 - r);
  }
}
