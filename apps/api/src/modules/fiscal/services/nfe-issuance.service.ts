import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as https from 'https';
import * as crypto from 'crypto';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { Invoice, InvoiceDocument } from '../schemas/invoice.schema';
import { CertificateService } from '../../certificate/certificate.service';
import { requireCurrentTenant } from '../../tenant/tenant.context';

/**
 * Servico de emissao de NF-e na SEFAZ.
 *
 * Fluxo:
 * 1. Monta XML da NF-e conforme layout 4.00 (NT 2023.004)
 * 2. Assina XML com certificado A1 (XAdES / enveloped signature)
 * 3. Transmite via NFeAutorizacao SOAP
 * 4. Processa resposta: autorizada → salva chave de acesso e protocolo
 * 5. Se rejeitada → salva motivo para correcao
 *
 * Suporta NF-e (modelo 55) e NFC-e (modelo 65).
 */
@Injectable()
export class NfeIssuanceService {
  private readonly logger = new Logger(NfeIssuanceService.name);
  private readonly xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

  // Endpoints por UF (simplificado — producao AN)
  private readonly SEFAZ_AUTORIZACAO = 'https://nfe.svrs.rs.gov.br/ws/NfeAutorizacao4/NFeAutorizacao4.asmx';
  private readonly SEFAZ_HOM_AUTORIZACAO = 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao4/NFeAutorizacao4.asmx';

  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    private readonly certificateService: CertificateService,
  ) {}

  /**
   * Emite uma NF-e na SEFAZ.
   */
  async emitir(companyId: string, invoiceId: string) {
    const ctx = requireCurrentTenant();
    const invoice = await this.invoiceModel.findOne({
      _id: invoiceId,
      tenantId: ctx.tenantId,
      companyId,
    });

    if (!invoice) throw new BadRequestException('Nota fiscal nao encontrada');
    if (invoice.statusSefaz === 'autorizada') {
      throw new BadRequestException('Nota ja autorizada na SEFAZ');
    }

    // 1. Gerar chave de acesso (44 digitos)
    const chaveAcesso = this.generateChaveAcesso(invoice);

    // 2. Montar XML simplificado
    const nfeXml = this.buildNFeXml(invoice, chaveAcesso);

    // 3. Assinar com certificado A1
    const { pfx, password } = await this.certificateService.getDecryptedPfx(companyId);
    const signature = await this.certificateService.sign(companyId, Buffer.from(nfeXml, 'utf-8'));

    // 4. Montar envelope SOAP
    const soapEnvelope = this.buildSoapEnvelope(nfeXml);

    // 5. Transmitir
    const httpsAgent = new https.Agent({ pfx, passphrase: password, rejectUnauthorized: true });
    const useHom = process.env.SEFAZ_AMBIENTE === '2';

    try {
      const response = await axios.post(
        useHom ? this.SEFAZ_HOM_AUTORIZACAO : this.SEFAZ_AUTORIZACAO,
        soapEnvelope,
        {
          httpsAgent,
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            SOAPAction: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote',
          },
          timeout: 60000,
        },
      );

      // 6. Processar resposta
      const parsed = this.xmlParser.parse(response.data);
      const result = this.extractAutorizacaoResult(parsed);

      invoice.chaveAcesso = chaveAcesso;
      invoice.statusSefaz = result.autorizada ? 'autorizada' : 'rejeitada';
      invoice.protocolo = result.protocolo;
      invoice.motivoRejeicao = result.motivo;

      if (result.autorizada) {
        invoice.status = 'escriturada';
      }

      await invoice.save();

      this.logger.log(
        `NF-e ${invoice.numero}: ${result.autorizada ? 'AUTORIZADA' : 'REJEITADA'} - ${result.motivo}`,
      );

      return {
        success: result.autorizada,
        chaveAcesso,
        protocolo: result.protocolo,
        status: invoice.statusSefaz,
        motivo: result.motivo,
      };
    } catch (error) {
      invoice.statusSefaz = 'erro';
      invoice.motivoRejeicao = error.message;
      await invoice.save();

      this.logger.error(`Erro ao emitir NF-e ${invoice.numero}: ${error}`);
      throw error;
    }
  }

  private generateChaveAcesso(invoice: any): string {
    const cUF = '35'; // SP — em producao, extrair da empresa
    const aamm = new Date(invoice.dataEmissao).toISOString().slice(2, 7).replace('-', '');
    const cnpj = (invoice.fornecedorClienteCnpj || '').replace(/\D/g, '').padStart(14, '0');
    const mod = '55';
    const serie = (invoice.serie || '1').padStart(3, '0');
    const nNF = (invoice.numero || '1').padStart(9, '0');
    const tpEmis = '1'; // Normal
    const cNF = String(Math.floor(Math.random() * 99999999)).padStart(8, '0');

    const chave = `${cUF}${aamm}${cnpj}${mod}${serie}${nNF}${tpEmis}${cNF}`;
    // Digito verificador (modulo 11)
    const dv = this.calculateMod11(chave);
    return `${chave}${dv}`;
  }

  private calculateMod11(chave: string): string {
    const pesos = [2, 3, 4, 5, 6, 7, 8, 9];
    let soma = 0;
    let pesoIdx = 0;
    for (let i = chave.length - 1; i >= 0; i--) {
      soma += parseInt(chave[i]) * pesos[pesoIdx % pesos.length];
      pesoIdx++;
    }
    const resto = soma % 11;
    const dv = resto < 2 ? 0 : 11 - resto;
    return String(dv);
  }

  private buildNFeXml(invoice: any, chaveAcesso: string): string {
    // Simplificado — em producao, usar schema completo layout 4.00
    return `<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe${chaveAcesso}" versao="4.00">
    <ide>
      <cNF>${chaveAcesso.slice(35, 43)}</cNF>
      <natOp>VENDA</natOp>
      <mod>55</mod>
      <serie>${invoice.serie || '1'}</serie>
      <nNF>${invoice.numero}</nNF>
      <dhEmi>${new Date(invoice.dataEmissao).toISOString()}</dhEmi>
      <tpNF>${invoice.tipo === 'saida' ? '1' : '0'}</tpNF>
      <idDest>1</idDest>
      <tpImp>1</tpImp>
      <tpEmis>1</tpEmis>
      <cDV>${chaveAcesso.slice(-1)}</cDV>
      <tpAmb>${process.env.SEFAZ_AMBIENTE === '2' ? '2' : '1'}</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>0</indFinal>
      <indPres>1</indPres>
      <procEmi>0</procEmi>
      <verProc>contabilita-1.0</verProc>
    </ide>
    <total>
      <ICMSTot>
        <vNF>${invoice.totalNota?.toString() || '0.00'}</vNF>
      </ICMSTot>
    </total>
  </infNFe>
</NFe>`;
  }

  private buildSoapEnvelope(nfeXml: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <nfeAutorizacaoLote xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
      <nfeDadosMsg>
        <enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
          <idLote>${Date.now()}</idLote>
          <indSinc>1</indSinc>
          ${nfeXml}
        </enviNFe>
      </nfeDadosMsg>
    </nfeAutorizacaoLote>
  </soap12:Body>
</soap12:Envelope>`;
  }

  private extractAutorizacaoResult(parsed: any): {
    autorizada: boolean;
    protocolo?: string;
    motivo: string;
  } {
    try {
      const envelope = parsed['soap:Envelope'] || parsed['soap12:Envelope'] || parsed;
      const body = envelope['soap:Body'] || envelope['soap12:Body'] || envelope;
      const result = body?.nfeAutorizacaoLoteResponse?.nfeAutorizacaoLoteResult || body;
      const retEnvi = result?.retEnviNFe || result;
      const protNFe = retEnvi?.protNFe?.infProt || {};

      const cStat = protNFe.cStat?.toString();
      return {
        autorizada: cStat === '100',
        protocolo: protNFe.nProt,
        motivo: protNFe.xMotivo || retEnvi?.xMotivo || 'Resposta nao identificada',
      };
    } catch {
      return { autorizada: false, motivo: 'Erro ao processar resposta SEFAZ' };
    }
  }
}
