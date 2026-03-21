import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
    private eventEmitter: EventEmitter2,
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
   * Despacha para metodo especifico conforme o tipo da folha.
   */
  async calculate(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const run = await this.runModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!run) throw new NotFoundException('Folha nao encontrada');

    if (run.status !== StatusFolha.Rascunho) {
      throw new BadRequestException('Folha ja foi calculada. Crie uma nova ou reabra.');
    }

    // Buscar funcionarios ativos (ou todos para rescisao)
    const statusFilter = run.tipo === TipoFolha.Rescisao
      ? {} // Rescisao pode incluir funcionarios sendo desligados
      : { status: StatusFuncionario.Ativo };
    const employees = await this.employeeModel.find({
      tenantId: ctx.tenantId, companyId, ...statusFilter,
    });

    if (employees.length === 0) {
      throw new BadRequestException('Nenhum funcionario encontrado');
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
      const numDep = emp.dependentes?.filter((d: any) => d.deducaoIrrf).length || 0;

      const { lines, proventos, descontos, liquido, inss, irrf, fgts } =
        this.buildPayslipByTipo(run.tipo, salario, numDep, emp);

      await this.payslipModel.create({
        tenantId: ctx.tenantId,
        companyId,
        payrollRunId: run._id,
        employeeId: emp._id,
        employeeName: emp.nome,
        employeeCpf: emp.cpf,
        lines,
        totalProventos: proventos.toString(),
        totalDescontos: descontos.toString(),
        salarioLiquido: liquido.toString(),
        baseInss: salario.toString(),
        valorInss: inss.toString(),
        baseIrrf: salario.toString(),
        valorIrrf: irrf.toString(),
        valorFgts: fgts.toString(),
      });

      totalBruto = totalBruto.plus(proventos);
      totalDescontos = totalDescontos.plus(descontos);
      totalLiquido = totalLiquido.plus(liquido);
      totalInss = totalInss.plus(inss);
      totalIrrf = totalIrrf.plus(irrf);
      totalFgts = totalFgts.plus(fgts);
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

    // Emite evento para geracao automatica de lancamentos contabeis
    this.eventEmitter.emit('payroll.run.completed', {
      tenantId: ctx.tenantId,
      companyId,
      runId: run._id.toString(),
      tipo: run.tipo,
      year: run.year,
      month: run.month,
      totalBruto: totalBruto.toString(),
      totalDescontos: totalDescontos.toString(),
      totalLiquido: totalLiquido.toString(),
      totalInss: totalInss.toString(),
      totalIrrf: totalIrrf.toString(),
      totalFgts: totalFgts.toString(),
    });

    return run;
  }

  /** Constroi as linhas do holerite conforme o tipo de folha */
  private buildPayslipByTipo(
    tipo: TipoFolha,
    salario: Decimal,
    numDep: number,
    emp: any,
  ) {
    switch (tipo) {
      case TipoFolha.Ferias:
        return this.buildFeriasPayslip(salario, numDep);
      case TipoFolha.DecimoTerceiroPrimeiraParcela:
        return this.build13oPayslip(salario, numDep, 1, emp);
      case TipoFolha.DecimoTerceiroSegundaParcela:
        return this.build13oPayslip(salario, numDep, 2, emp);
      case TipoFolha.Rescisao:
        return this.buildRescisaoPayslip(salario, numDep, emp);
      default:
        return this.buildMensalPayslip(salario, numDep);
    }
  }

  private buildMensalPayslip(salario: Decimal, numDep: number) {
    const calc = this.calcService.calculate(salario, numDep);
    const lines = [
      { codigo: '001', descricao: 'Salario Base', tipo: TipoRubrica.Provento, referencia: '30', valor: calc.salarioBruto.toString() },
      { codigo: '100', descricao: 'INSS', tipo: TipoRubrica.Desconto, referencia: '0', valor: calc.inss.toString() },
      { codigo: '101', descricao: 'IRRF', tipo: TipoRubrica.Desconto, referencia: numDep.toString(), valor: calc.irrf.toString() },
      { codigo: '900', descricao: 'FGTS', tipo: TipoRubrica.Informativa, referencia: '8', valor: calc.fgts.toString() },
    ];
    return {
      lines,
      proventos: calc.totalProventos,
      descontos: calc.totalDescontos,
      liquido: calc.salarioLiquido,
      inss: calc.inss,
      irrf: calc.irrf,
      fgts: calc.fgts,
    };
  }

  private buildFeriasPayslip(salario: Decimal, numDep: number) {
    const ferias = this.calcService.calcularFerias(salario, 30, 0);
    const inss = this.calcService.calcularInss(ferias.total);
    const baseIrrf = this.calcService.calcularBaseIrrf(ferias.total, inss, numDep);
    const irrf = this.calcService.calcularIrrf(baseIrrf);
    const fgts = this.calcService.calcularFgts(ferias.total);
    const descontos = inss.plus(irrf);

    const lines = [
      { codigo: '010', descricao: 'Ferias (30 dias)', tipo: TipoRubrica.Provento, referencia: '30', valor: ferias.valorFerias.toString() },
      { codigo: '011', descricao: '1/3 Constitucional', tipo: TipoRubrica.Provento, referencia: '0', valor: ferias.tercoConstitucional.toString() },
      { codigo: '100', descricao: 'INSS', tipo: TipoRubrica.Desconto, referencia: '0', valor: inss.toString() },
      { codigo: '101', descricao: 'IRRF', tipo: TipoRubrica.Desconto, referencia: numDep.toString(), valor: irrf.toString() },
      { codigo: '900', descricao: 'FGTS', tipo: TipoRubrica.Informativa, referencia: '8', valor: fgts.toString() },
    ];

    return {
      lines,
      proventos: ferias.total,
      descontos,
      liquido: ferias.total.minus(descontos),
      inss,
      irrf,
      fgts,
    };
  }

  private build13oPayslip(salario: Decimal, numDep: number, parcela: 1 | 2, emp: any) {
    const dataAdmissao = emp.dataAdmissao ? new Date(emp.dataAdmissao) : new Date();
    const mesesTrabalhados = Math.min(new Date().getMonth() + 1, 12);
    const valor13 = this.calcService.calcular13o(salario, mesesTrabalhados, parcela);

    const lines: any[] = [
      { codigo: '020', descricao: `13o Salario (${parcela}a parcela)`, tipo: TipoRubrica.Provento, referencia: mesesTrabalhados.toString(), valor: valor13.toString() },
    ];

    let inss = new Decimal(0);
    let irrf = new Decimal(0);
    let descontos = new Decimal(0);

    if (parcela === 2) {
      // Descontos apenas na 2a parcela (sobre o valor integral)
      const valorIntegral = this.calcService.calcular13o(salario, mesesTrabalhados, 2);
      inss = this.calcService.calcularInss(valorIntegral);
      const baseIrrf = this.calcService.calcularBaseIrrf(valorIntegral, inss, numDep);
      irrf = this.calcService.calcularIrrf(baseIrrf);
      descontos = inss.plus(irrf);
      lines.push(
        { codigo: '100', descricao: 'INSS', tipo: TipoRubrica.Desconto, referencia: '0', valor: inss.toString() },
        { codigo: '101', descricao: 'IRRF', tipo: TipoRubrica.Desconto, referencia: numDep.toString(), valor: irrf.toString() },
      );
    }

    const fgts = this.calcService.calcularFgts(valor13);
    lines.push({ codigo: '900', descricao: 'FGTS', tipo: TipoRubrica.Informativa, referencia: '8', valor: fgts.toString() });

    return {
      lines,
      proventos: valor13,
      descontos,
      liquido: valor13.minus(descontos),
      inss,
      irrf,
      fgts,
    };
  }

  private buildRescisaoPayslip(salario: Decimal, numDep: number, emp: any) {
    const dataAdmissao = emp.dataAdmissao ? new Date(emp.dataAdmissao) : new Date();
    const dataDesligamento = new Date();
    const diasTrabalhados = dataDesligamento.getDate();

    const rescisao = this.calcService.calcularRescisao({
      salarioBruto: salario,
      dataAdmissao,
      dataDesligamento,
      numDependentes: numDep,
      diasTrabalhadosMes: diasTrabalhados,
      avisoPrevioIndenizado: true,
      motivoRescisao: 'sem_justa_causa',
      saldoFgts: new Decimal(0), // Simplificado - idealmente viria do historico
    });

    const lines = [
      { codigo: '030', descricao: 'Saldo de Salario', tipo: TipoRubrica.Provento, referencia: diasTrabalhados.toString(), valor: rescisao.saldoSalario.toString() },
      { codigo: '031', descricao: 'Ferias Proporcionais', tipo: TipoRubrica.Provento, referencia: '0', valor: rescisao.feriasProporcionais.toString() },
      { codigo: '032', descricao: '1/3 Ferias', tipo: TipoRubrica.Provento, referencia: '0', valor: rescisao.tercoFerias.toString() },
      { codigo: '033', descricao: '13o Proporcional', tipo: TipoRubrica.Provento, referencia: '0', valor: rescisao.decimoTerceiroProporcional.toString() },
      { codigo: '034', descricao: 'Aviso Previo Indenizado', tipo: TipoRubrica.Provento, referencia: '0', valor: rescisao.avisoPrevio.toString() },
      { codigo: '035', descricao: 'Multa FGTS 40%', tipo: TipoRubrica.Provento, referencia: '0', valor: rescisao.multaFgts.toString() },
      { codigo: '100', descricao: 'INSS', tipo: TipoRubrica.Desconto, referencia: '0', valor: rescisao.inss.toString() },
      { codigo: '101', descricao: 'IRRF', tipo: TipoRubrica.Desconto, referencia: numDep.toString(), valor: rescisao.irrf.toString() },
    ];

    return {
      lines,
      proventos: rescisao.totalBruto,
      descontos: rescisao.totalDescontos,
      liquido: rescisao.totalLiquido,
      inss: rescisao.inss,
      irrf: rescisao.irrf,
      fgts: rescisao.multaFgts,
    };
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
