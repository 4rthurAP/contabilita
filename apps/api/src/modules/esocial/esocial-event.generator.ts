import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import dayjs from 'dayjs';
import { EsocialEventType } from './schemas/esocial-event.schema';

/**
 * Gerador de XMLs para eventos eSocial.
 * Layout conforme Manual de Orientacao do eSocial (MOS) v2.5/S-1.2.
 */
@Injectable()
export class EsocialEventGenerator {
  private readonly logger = new Logger(EsocialEventGenerator.name);

  constructor(
    @InjectModel('Employee') private employeeModel: Model<any>,
    @InjectModel('PayrollRun') private payrollModel: Model<any>,
    @InjectModel('Company') private companyModel: Model<any>,
  ) {}

  /** S-1000: Informacoes do empregador/contribuinte */
  async generateS1000(tenantId: string, companyId: string): Promise<string> {
    const company = await this.companyModel.findById(companyId);
    if (!company) throw new Error('Empresa nao encontrada');
    const cnpj = (company.cnpj || '').replace(/\D/g, '');

    return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtInfoEmpregador/v_S_01_02_00">
  <evtInfoEmpregador Id="ID1${cnpj}${Date.now()}">
    <ideEvento>
      <tpAmb>${process.env.ESOCIAL_AMBIENTE === '2' ? '2' : '1'}</tpAmb>
      <procEmi>1</procEmi>
      <verProc>contabilita-1.0</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpj.substring(0, 8)}</nrInsc>
    </ideEmpregador>
    <infoEmpregador>
      <inclusao>
        <idePeriodo>
          <iniValid>${dayjs().format('YYYY-MM')}</iniValid>
        </idePeriodo>
        <infoCadastro>
          <classTrib>99</classTrib>
          <indCoop>0</indCoop>
          <indConstr>0</indConstr>
          <indDesFolha>0</indDesFolha>
          <indOpcCP>0</indOpcCP>
          <contato>
            <nmCtt>${company.razaoSocial}</nmCtt>
            <cpfCtt></cpfCtt>
            <foneFixo></foneFixo>
            <email></email>
          </contato>
        </infoCadastro>
      </inclusao>
    </infoEmpregador>
  </evtInfoEmpregador>
</eSocial>`;
  }

  /** S-2200: Cadastramento inicial / admissao */
  async generateS2200(tenantId: string, companyId: string, employeeId: string): Promise<string> {
    const [company, employee] = await Promise.all([
      this.companyModel.findById(companyId),
      this.employeeModel.findById(employeeId),
    ]);
    if (!company || !employee) throw new Error('Empresa ou funcionario nao encontrado');
    const cnpj = (company.cnpj || '').replace(/\D/g, '');
    const cpf = (employee.cpf || '').replace(/\D/g, '');

    return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtAdmissao/v_S_01_02_00">
  <evtAdmissao Id="ID1${cnpj}${Date.now()}">
    <ideEvento>
      <indRetif>1</indRetif>
      <tpAmb>${process.env.ESOCIAL_AMBIENTE === '2' ? '2' : '1'}</tpAmb>
      <procEmi>1</procEmi>
      <verProc>contabilita-1.0</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpj.substring(0, 8)}</nrInsc>
    </ideEmpregador>
    <trabalhador>
      <cpfTrab>${cpf}</cpfTrab>
      <nmTrab>${employee.nome}</nmTrab>
      <dtNascto>${dayjs(employee.dataNascimento).format('YYYY-MM-DD')}</dtNascto>
    </trabalhador>
    <vinculo>
      <matricula>${employee.matricula || cpf}</matricula>
      <tpRegTrab>1</tpRegTrab>
      <tpRegPrev>1</tpRegPrev>
      <dtAdm>${dayjs(employee.dataAdmissao).format('YYYY-MM-DD')}</dtAdm>
      <infoRegimeTrab>
        <infoCeletista>
          <dtAdm>${dayjs(employee.dataAdmissao).format('YYYY-MM-DD')}</dtAdm>
          <tpAdmissao>1</tpAdmissao>
          <indAdmissao>1</indAdmissao>
          <tpRegJor>1</tpRegJor>
          <natAtividade>1</natAtividade>
        </infoCeletista>
      </infoRegimeTrab>
      <infoContrato>
        <codCargo>${employee.cargo || '00001'}</codCargo>
        <vrSalFx>${employee.salarioBase?.toString() || '0.00'}</vrSalFx>
        <undSalFixo>5</undSalFixo>
      </infoContrato>
    </vinculo>
  </evtAdmissao>
</eSocial>`;
  }

  /** S-1200: Remuneracao do trabalhador vinculado */
  async generateS1200(
    tenantId: string,
    companyId: string,
    employeeId: string,
    payrollRunId: string,
    competencia: string,
  ): Promise<string> {
    const [company, employee, payroll] = await Promise.all([
      this.companyModel.findById(companyId),
      this.employeeModel.findById(employeeId),
      this.payrollModel.findById(payrollRunId),
    ]);
    if (!company || !employee) throw new Error('Empresa ou funcionario nao encontrado');
    const cnpj = (company.cnpj || '').replace(/\D/g, '');
    const cpf = (employee.cpf || '').replace(/\D/g, '');

    // Buscar contracheque do funcionario nesta folha
    const payslip = payroll?.payslips?.find(
      (p: any) => p.employeeId?.toString() === employeeId,
    );
    const salarioBruto = payslip?.salarioBruto?.toString() || employee.salarioBase?.toString() || '0';
    const inss = payslip?.descontoInss?.toString() || '0';
    const irrf = payslip?.descontoIrrf?.toString() || '0';

    return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtRemun/v_S_01_02_00">
  <evtRemun Id="ID1${cnpj}${Date.now()}">
    <ideEvento>
      <indRetif>1</indRetif>
      <perApur>${competencia}</perApur>
      <tpAmb>${process.env.ESOCIAL_AMBIENTE === '2' ? '2' : '1'}</tpAmb>
      <procEmi>1</procEmi>
      <verProc>contabilita-1.0</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpj.substring(0, 8)}</nrInsc>
    </ideEmpregador>
    <ideTrabalhador>
      <cpfTrab>${cpf}</cpfTrab>
    </ideTrabalhador>
    <dmDev>
      <ideDmDev>1</ideDmDev>
      <infoPerApur>
        <ideEstabLot>
          <tpInsc>1</tpInsc>
          <nrInsc>${cnpj}</nrInsc>
          <codLotacao>1</codLotacao>
          <detVerbas>
            <codRubr>1000</codRubr>
            <ideTabRubr>1</ideTabRubr>
            <vrRubr>${salarioBruto}</vrRubr>
          </detVerbas>
          <detVerbas>
            <codRubr>9201</codRubr>
            <ideTabRubr>1</ideTabRubr>
            <vrRubr>${inss}</vrRubr>
          </detVerbas>
          <detVerbas>
            <codRubr>9203</codRubr>
            <ideTabRubr>1</ideTabRubr>
            <vrRubr>${irrf}</vrRubr>
          </detVerbas>
        </ideEstabLot>
      </infoPerApur>
    </dmDev>
  </evtRemun>
</eSocial>`;
  }

  /** S-2299: Desligamento */
  async generateS2299(tenantId: string, companyId: string, employeeId: string, dataDesligamento: string, motivo: string): Promise<string> {
    const [company, employee] = await Promise.all([
      this.companyModel.findById(companyId),
      this.employeeModel.findById(employeeId),
    ]);
    if (!company || !employee) throw new Error('Empresa ou funcionario nao encontrado');
    const cnpj = (company.cnpj || '').replace(/\D/g, '');
    const cpf = (employee.cpf || '').replace(/\D/g, '');

    return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtDeslig/v_S_01_02_00">
  <evtDeslig Id="ID1${cnpj}${Date.now()}">
    <ideEvento>
      <indRetif>1</indRetif>
      <tpAmb>${process.env.ESOCIAL_AMBIENTE === '2' ? '2' : '1'}</tpAmb>
      <procEmi>1</procEmi>
      <verProc>contabilita-1.0</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpj.substring(0, 8)}</nrInsc>
    </ideEmpregador>
    <ideVinculo>
      <cpfTrab>${cpf}</cpfTrab>
      <matricula>${employee.matricula || cpf}</matricula>
    </ideVinculo>
    <infoDeslig>
      <mtvDeslig>${motivo}</mtvDeslig>
      <dtDeslig>${dataDesligamento}</dtDeslig>
    </infoDeslig>
  </evtDeslig>
</eSocial>`;
  }
}
