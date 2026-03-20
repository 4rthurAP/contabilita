import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Decimal from 'decimal.js';
import { PayrollRun, PayrollRunDocument } from '../schemas/payroll-run.schema';
import { Payslip, PayslipDocument } from '../schemas/payslip.schema';
import { Employee, EmployeeDocument } from '../schemas/employee.schema';
import { PayrollCalcService } from './payroll-calc.service';
import { requireCurrentTenant } from '../../tenant/tenant.context';
import { StatusFolha, TipoFolha, StatusFuncionario, TipoRubrica } from '@contabilita/shared';

@Injectable()
export class PayrollRunService {
  constructor(
    @InjectModel(PayrollRun.name) private runModel: Model<PayrollRunDocument>,
    @InjectModel(Payslip.name) private payslipModel: Model<PayslipDocument>,
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    private calcService: PayrollCalcService,
  ) {}

  /** Cria uma folha mensal em status rascunho */
  async create(companyId: string, year: number, month: number, tipo = TipoFolha.Mensal) {
    const ctx = requireCurrentTenant();

    const existing = await this.runModel.findOne({
      tenantId: ctx.tenantId, companyId, year, month, tipo,
    });
    if (existing) throw new BadRequestException(`Folha ${month}/${year} ja existe`);

    return this.runModel.create({
      tenantId: ctx.tenantId, companyId, year, month, tipo,
      status: StatusFolha.Rascunho,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
  }

  /**
   * Calcula a folha: gera holerites para todos os funcionarios ativos.
   */
  async calculate(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const run = await this.runModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!run) throw new NotFoundException('Folha nao encontrada');

    if (run.status !== StatusFolha.Rascunho) {
      throw new BadRequestException('Folha ja foi calculada. Crie uma nova ou reabra.');
    }

    // Buscar funcionarios ativos
    const employees = await this.employeeModel.find({
      tenantId: ctx.tenantId, companyId, status: StatusFuncionario.Ativo,
    });

    if (employees.length === 0) {
      throw new BadRequestException('Nenhum funcionario ativo encontrado');
    }

    // Limpar payslips anteriores (recalculo)
    await this.payslipModel.deleteMany({ payrollRunId: run._id });

    let totalBruto = new Decimal(0);
    let totalDescontos = new Decimal(0);
    let totalLiquido = new Decimal(0);
    let totalInss = new Decimal(0);
    let totalIrrf = new Decimal(0);
    let totalFgts = new Decimal(0);

    for (const emp of employees) {
      const salario = new Decimal(emp.salarioBase.toString());
      const numDep = emp.dependentes?.filter((d) => d.deducaoIrrf).length || 0;

      const calc = this.calcService.calculate(salario, numDep);

      const lines = [
        { codigo: '001', descricao: 'Salario Base', tipo: TipoRubrica.Provento, referencia: '30', valor: calc.salarioBruto.toString() },
        { codigo: '100', descricao: 'INSS', tipo: TipoRubrica.Desconto, referencia: '0', valor: calc.inss.toString() },
        { codigo: '101', descricao: 'IRRF', tipo: TipoRubrica.Desconto, referencia: numDep.toString(), valor: calc.irrf.toString() },
        { codigo: '900', descricao: 'FGTS', tipo: TipoRubrica.Informativa, referencia: '8', valor: calc.fgts.toString() },
      ];

      await this.payslipModel.create({
        tenantId: ctx.tenantId,
        companyId,
        payrollRunId: run._id,
        employeeId: emp._id,
        employeeName: emp.nome,
        employeeCpf: emp.cpf,
        lines,
        totalProventos: calc.totalProventos.toString(),
        totalDescontos: calc.totalDescontos.toString(),
        salarioLiquido: calc.salarioLiquido.toString(),
        baseInss: calc.salarioBruto.toString(),
        valorInss: calc.inss.toString(),
        baseIrrf: calc.baseIrrf.toString(),
        valorIrrf: calc.irrf.toString(),
        valorFgts: calc.fgts.toString(),
      });

      totalBruto = totalBruto.plus(calc.totalProventos);
      totalDescontos = totalDescontos.plus(calc.totalDescontos);
      totalLiquido = totalLiquido.plus(calc.salarioLiquido);
      totalInss = totalInss.plus(calc.inss);
      totalIrrf = totalIrrf.plus(calc.irrf);
      totalFgts = totalFgts.plus(calc.fgts);
    }

    run.status = StatusFolha.Calculada;
    run.totalBruto = totalBruto.toString() as any;
    run.totalDescontos = totalDescontos.toString() as any;
    run.totalLiquido = totalLiquido.toString() as any;
    run.totalInss = totalInss.toString() as any;
    run.totalIrrf = totalIrrf.toString() as any;
    run.totalFgts = totalFgts.toString() as any;
    run.totalFuncionarios = employees.length;
    run.calculatedAt = new Date();
    await run.save();

    return run;
  }

  async approve(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const run = await this.runModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!run) throw new NotFoundException('Folha nao encontrada');
    if (run.status !== StatusFolha.Calculada) throw new BadRequestException('Folha deve estar calculada');

    run.status = StatusFolha.Aprovada;
    run.approvedAt = new Date();
    return run.save();
  }

  async close(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const run = await this.runModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!run) throw new NotFoundException('Folha nao encontrada');
    if (run.status !== StatusFolha.Aprovada) throw new BadRequestException('Folha deve estar aprovada');

    run.status = StatusFolha.Fechada;
    run.closedAt = new Date();
    return run.save();
  }

  async findAll(companyId: string, year?: number) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, companyId };
    if (year) filter.year = year;
    return this.runModel.find(filter).sort({ year: -1, month: -1 });
  }

  async findById(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const run = await this.runModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!run) throw new NotFoundException('Folha nao encontrada');
    return run;
  }

  async getPayslips(companyId: string, runId: string) {
    const ctx = requireCurrentTenant();
    return this.payslipModel
      .find({ tenantId: ctx.tenantId, companyId, payrollRunId: runId })
      .sort({ employeeName: 1 });
  }

  async getPayslip(companyId: string, payslipId: string) {
    const ctx = requireCurrentTenant();
    const ps = await this.payslipModel.findOne({
      _id: payslipId, tenantId: ctx.tenantId, companyId,
    });
    if (!ps) throw new NotFoundException('Holerite nao encontrado');
    return ps;
  }
}
