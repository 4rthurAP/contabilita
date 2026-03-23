import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Decimal from 'decimal.js';
import dayjs from 'dayjs';
import { Invoice, InvoiceDocument } from '../../fiscal/schemas/invoice.schema';
import { Company, CompanyDocument } from '../../company/schemas/company.schema';

/**
 * Gerador de eventos EFD-Reinf (Escrituracao Fiscal Digital de Retencoes
 * e Outras Informacoes Fiscais).
 *
 * Eventos gerados:
 * - R-1000: Informacoes do contribuinte (abertura)
 * - R-2010: Retencao - servicos tomados (INSS sobre servicos)
 * - R-4010: Pagamentos/creditos a beneficiarios PF (IRRF)
 * - R-4020: Pagamentos/creditos a beneficiarios PJ (IRRF, PIS, COFINS, CSLL)
 * - R-9000: Exclusao de eventos (quando necessario)
 *
 * Formato: XML conforme leiautes da EFD-Reinf (versao 2.1.2)
 */
@Injectable()
export class SpedReinfGenerator {
  private readonly logger = new Logger(SpedReinfGenerator.name);

  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async generate(
    tenantId: string,
    companyId: string,
    year: number,
    month: number,
  ): Promise<{ events: string[]; summary: ReinfSummary }> {
    const company = await this.companyModel.findById(companyId);
    if (!company) throw new Error('Empresa nao encontrada');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const perApur = `${year}-${String(month).padStart(2, '0')}`;

    // Buscar NFs de servico com retencao
    const invoices = await this.invoiceModel.find({
      tenantId,
      companyId,
      status: 'escriturada',
      dataEmissao: { $gte: startDate, $lte: endDate },
    });

    const events: string[] = [];
    const summary: ReinfSummary = {
      r1000: false,
      r2010Count: 0,
      r4010Count: 0,
      r4020Count: 0,
      totalRetencaoInss: '0',
      totalRetencaoIrrf: '0',
      totalRetencaoPcc: '0',
    };

    // R-1000: Informacoes do contribuinte
    events.push(this.generateR1000(company, perApur));
    summary.r1000 = true;

    // R-2010: Servicos tomados com retencao INSS (11%)
    const servicosTomados = invoices.filter(
      (inv) => inv.tipo === 'entrada' && this.hasInssRetention(inv),
    );

    for (const inv of servicosTomados) {
      const event = this.generateR2010(company, inv, perApur);
      events.push(event);
      summary.r2010Count++;

      const retencao = this.calculateInssRetention(inv);
      summary.totalRetencaoInss = new Decimal(summary.totalRetencaoInss)
        .plus(retencao)
        .toString();
    }

    // R-4020: Pagamentos a PJ com retencao (IRRF, PIS, COFINS, CSLL)
    const pagamentosPJ = invoices.filter(
      (inv) => inv.tipo === 'entrada' && this.hasPccRetention(inv),
    );

    for (const inv of pagamentosPJ) {
      const event = this.generateR4020(company, inv, perApur);
      events.push(event);
      summary.r4020Count++;

      const retencoes = this.calculatePccRetention(inv);
      summary.totalRetencaoIrrf = new Decimal(summary.totalRetencaoIrrf)
        .plus(retencoes.irrf)
        .toString();
      summary.totalRetencaoPcc = new Decimal(summary.totalRetencaoPcc)
        .plus(retencoes.pcc)
        .toString();
    }

    this.logger.log(
      `Reinf ${perApur}: ${events.length} eventos gerados (R-2010: ${summary.r2010Count}, R-4020: ${summary.r4020Count})`,
    );

    return { events, summary };
  }

  // ── Geradores de eventos XML ──────────────────

  private generateR1000(company: any, perApur: string): string {
    const cnpj = (company.cnpj || '').replace(/\D/g, '');
    return `<?xml version="1.0" encoding="UTF-8"?>
<Reinf xmlns="http://www.reinf.esocial.gov.br/schemas/evtInfoContri/v2_01_02">
  <evtInfoContri id="ID${cnpj}${perApur.replace('-', '')}00001">
    <ideEvento>
      <tpAmb>${process.env.SEFAZ_AMBIENTE === '2' ? '2' : '1'}</tpAmb>
      <procEmi>1</procEmi>
      <verProc>contabilita-1.0</verProc>
    </ideEvento>
    <ideContri>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpj.substring(0, 8)}</nrInsc>
    </ideContri>
    <infoContri>
      <inclusao>
        <idePeriodo>
          <iniValid>${perApur}</iniValid>
        </idePeriodo>
        <infoCadastro>
          <classTrib>99</classTrib>
          <indEscrituracao>1</indEscrituracao>
          <indDesoneracao>0</indDesoneracao>
          <indAcordoIsenMulta>0</indAcordoIsenMulta>
          <contato>
            <nmCtt>${company.razaoSocial || ''}</nmCtt>
            <cpfCtt>${cnpj.substring(0, 11)}</cpfCtt>
          </contato>
        </infoCadastro>
      </inclusao>
    </infoContri>
  </evtInfoContri>
</Reinf>`;
  }

  private generateR2010(company: any, invoice: any, perApur: string): string {
    const cnpj = (company.cnpj || '').replace(/\D/g, '');
    const prestCnpj = (invoice.fornecedorClienteCnpj || '').replace(/\D/g, '');
    const valorServico = new Decimal(invoice.totalNota?.toString() || '0');
    const retencaoInss = this.calculateInssRetention(invoice);

    return `<?xml version="1.0" encoding="UTF-8"?>
<Reinf xmlns="http://www.reinf.esocial.gov.br/schemas/evtServTom/v2_01_02">
  <evtServTom id="ID${cnpj}${perApur.replace('-', '')}${invoice._id.toString().slice(-5)}">
    <ideEvento>
      <indRetif>1</indRetif>
      <perApur>${perApur}</perApur>
      <tpAmb>${process.env.SEFAZ_AMBIENTE === '2' ? '2' : '1'}</tpAmb>
      <procEmi>1</procEmi>
      <verProc>contabilita-1.0</verProc>
    </ideEvento>
    <ideContri>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpj.substring(0, 8)}</nrInsc>
    </ideContri>
    <infoServTom>
      <ideEstabObra>
        <tpInscEstab>1</tpInscEstab>
        <nrInscEstab>${cnpj}</nrInscEstab>
        <idePrestServ>
          <cnpjPrestador>${prestCnpj}</cnpjPrestador>
          <vlrTotalBruto>${valorServico.toFixed(2)}</vlrTotalBruto>
          <vlrTotalBaseRet>${valorServico.toFixed(2)}</vlrTotalBaseRet>
          <vlrTotalRetPrinc>${retencaoInss.toFixed(2)}</vlrTotalRetPrinc>
          <vlrTotalNRetPrinc>0.00</vlrTotalNRetPrinc>
          <nfs>
            <serie>${invoice.serie || '1'}</serie>
            <numDocto>${invoice.numero || ''}</numDocto>
            <dtEmissaoNF>${dayjs(invoice.dataEmissao).format('YYYY-MM-DD')}</dtEmissaoNF>
            <vlrBruto>${valorServico.toFixed(2)}</vlrBruto>
            <tp>0</tp>
          </nfs>
        </idePrestServ>
      </ideEstabObra>
    </infoServTom>
  </evtServTom>
</Reinf>`;
  }

  private generateR4020(company: any, invoice: any, perApur: string): string {
    const cnpj = (company.cnpj || '').replace(/\D/g, '');
    const benefCnpj = (invoice.fornecedorClienteCnpj || '').replace(/\D/g, '');
    const valorBruto = new Decimal(invoice.totalNota?.toString() || '0');
    const retencoes = this.calculatePccRetention(invoice);

    return `<?xml version="1.0" encoding="UTF-8"?>
<Reinf xmlns="http://www.reinf.esocial.gov.br/schemas/evt4020PagtoBeneficiarioPJ/v2_01_02">
  <evtRetPJ id="ID${cnpj}${perApur.replace('-', '')}${invoice._id.toString().slice(-5)}">
    <ideEvento>
      <indRetif>1</indRetif>
      <perApur>${perApur}</perApur>
      <tpAmb>${process.env.SEFAZ_AMBIENTE === '2' ? '2' : '1'}</tpAmb>
      <procEmi>1</procEmi>
      <verProc>contabilita-1.0</verProc>
    </ideEvento>
    <ideContri>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpj.substring(0, 8)}</nrInsc>
    </ideContri>
    <ideEstab>
      <tpInscEstab>1</tpInscEstab>
      <nrInscEstab>${cnpj}</nrInscEstab>
      <ideBenef>
        <cnpjBenef>${benefCnpj}</cnpjBenef>
        <idePgto>
          <natRend>15084</natRend>
          <infoPgto>
            <dtFG>${dayjs(invoice.dataEmissao).format('YYYY-MM-DD')}</dtFG>
            <vlrBruto>${valorBruto.toFixed(2)}</vlrBruto>
            <retencoes>
              <vlrBaseIR>${valorBruto.toFixed(2)}</vlrBaseIR>
              <vlrIR>${retencoes.irrf.toFixed(2)}</vlrIR>
              <vlrBaseCSLL>${valorBruto.toFixed(2)}</vlrBaseCSLL>
              <vlrCSLL>${retencoes.csll.toFixed(2)}</vlrCSLL>
              <vlrBaseCofins>${valorBruto.toFixed(2)}</vlrBaseCofins>
              <vlrCofins>${retencoes.cofins.toFixed(2)}</vlrCofins>
              <vlrBasePP>${valorBruto.toFixed(2)}</vlrBasePP>
              <vlrPP>${retencoes.pis.toFixed(2)}</vlrPP>
            </retencoes>
          </infoPgto>
        </idePgto>
      </ideBenef>
    </ideEstab>
  </evtRetPJ>
</Reinf>`;
  }

  // ── Helpers de retencao ──────────────────────

  private hasInssRetention(invoice: any): boolean {
    // Servicos de cessao de mao-de-obra estao sujeitos a retencao INSS 11%
    const cfopsServico = ['1933', '2933', '1949', '2949'];
    return (invoice.cfops || []).some((c: string) => cfopsServico.includes(c));
  }

  private calculateInssRetention(invoice: any): Decimal {
    const total = new Decimal(invoice.totalNota?.toString() || '0');
    return total.times('0.11').toDecimalPlaces(2); // 11% INSS
  }

  private hasPccRetention(invoice: any): boolean {
    // Servicos profissionais, consultorias, etc. sujeitos a retencao PCC + IRRF
    const total = new Decimal(invoice.totalNota?.toString() || '0');
    return total.gt(new Decimal('215.05')); // Limite minimo para retencao
  }

  private calculatePccRetention(invoice: any): {
    irrf: Decimal;
    csll: Decimal;
    cofins: Decimal;
    pis: Decimal;
    pcc: Decimal;
  } {
    const total = new Decimal(invoice.totalNota?.toString() || '0');
    const irrf = total.times('0.015').toDecimalPlaces(2);   // 1.5% IRRF
    const csll = total.times('0.01').toDecimalPlaces(2);     // 1.0% CSLL
    const cofins = total.times('0.03').toDecimalPlaces(2);   // 3.0% COFINS
    const pis = total.times('0.0065').toDecimalPlaces(2);    // 0.65% PIS

    return {
      irrf,
      csll,
      cofins,
      pis,
      pcc: csll.plus(cofins).plus(pis), // Total PCC (4.65%)
    };
  }
}

interface ReinfSummary {
  r1000: boolean;
  r2010Count: number;
  r4010Count: number;
  r4020Count: number;
  totalRetencaoInss: string;
  totalRetencaoIrrf: string;
  totalRetencaoPcc: string;
}
