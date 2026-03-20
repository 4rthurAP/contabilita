import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Employee, EmployeeDocument } from '../schemas/employee.schema';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { requireCurrentTenant } from '../../tenant/tenant.context';
import { StatusFuncionario } from '@contabilita/shared';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
  ) {}

  async create(companyId: string, dto: CreateEmployeeDto) {
    const ctx = requireCurrentTenant();

    const existing = await this.employeeModel.findOne({
      tenantId: ctx.tenantId,
      companyId,
      cpf: dto.cpf,
    });
    if (existing) throw new ConflictException('CPF ja cadastrado nesta empresa');

    return this.employeeModel.create({
      ...dto,
      tenantId: ctx.tenantId,
      companyId,
      dataAdmissao: new Date(dto.dataAdmissao),
      dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : undefined,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
  }

  async findAll(companyId: string, status?: string) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, companyId };
    if (status) filter.status = status;

    return this.employeeModel.find(filter).sort({ nome: 1 });
  }

  async findActive(companyId: string) {
    return this.findAll(companyId, StatusFuncionario.Ativo);
  }

  async findById(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const emp = await this.employeeModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!emp) throw new NotFoundException('Funcionario nao encontrado');
    return emp;
  }

  async update(companyId: string, id: string, dto: Partial<CreateEmployeeDto>) {
    const ctx = requireCurrentTenant();
    const emp = await this.employeeModel.findOneAndUpdate(
      { _id: id, tenantId: ctx.tenantId, companyId },
      { ...dto, updatedBy: ctx.userId },
      { new: true },
    );
    if (!emp) throw new NotFoundException('Funcionario nao encontrado');
    return emp;
  }

  async dismiss(companyId: string, id: string, dataDemissao: Date) {
    const ctx = requireCurrentTenant();
    const emp = await this.employeeModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!emp) throw new NotFoundException('Funcionario nao encontrado');

    emp.status = StatusFuncionario.Demitido;
    emp.dataDemissao = dataDemissao;
    return emp.save();
  }
}
