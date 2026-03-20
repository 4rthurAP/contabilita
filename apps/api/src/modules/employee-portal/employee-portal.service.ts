import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Employee, EmployeeDocument } from '../payroll/schemas/employee.schema';
import { Payslip, PayslipDocument } from '../payroll/schemas/payslip.schema';
import { requireCurrentTenant } from '../tenant/tenant.context';

@Injectable()
export class EmployeePortalService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    @InjectModel(Payslip.name) private payslipModel: Model<PayslipDocument>,
  ) {}

  async getMyProfile(userId: string) {
    const ctx = requireCurrentTenant();
    const employee = await this.employeeModel.findOne({ tenantId: ctx.tenantId, userId });
    if (!employee) throw new NotFoundException('Funcionario nao encontrado para este usuario');
    return employee;
  }

  async getMyPayslips(userId: string) {
    const ctx = requireCurrentTenant();
    const employee = await this.employeeModel.findOne({ tenantId: ctx.tenantId, userId });
    if (!employee) throw new NotFoundException('Funcionario nao encontrado para este usuario');
    return this.payslipModel
      .find({ tenantId: ctx.tenantId, employeeId: employee._id })
      .sort({ year: -1, month: -1 })
      .limit(24);
  }

  async getPayslipDetail(userId: string, payslipId: string) {
    const ctx = requireCurrentTenant();
    const employee = await this.employeeModel.findOne({ tenantId: ctx.tenantId, userId });
    if (!employee) throw new NotFoundException('Funcionario nao encontrado para este usuario');
    const payslip = await this.payslipModel.findOne({
      _id: payslipId,
      tenantId: ctx.tenantId,
      employeeId: employee._id,
    });
    if (!payslip) throw new NotFoundException('Holerite nao encontrado');
    return payslip;
  }
}
