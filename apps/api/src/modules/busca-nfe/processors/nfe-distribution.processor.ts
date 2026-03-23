import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model } from 'mongoose';
import { Queue, Job } from 'bullmq';
import * as https from 'https';
import * as zlib from 'zlib';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import { BuscaNfeLog, BuscaNfeLogDocument } from '../schemas/busca-nfe-log.schema';
import { CertificateService } from '../../certificate/certificate.service';
import { tenantContext } from '../../tenant/tenant.context';

export interface NfeDistributionJobData {
  tenantContext: { tenantId: string; userId: string; role: string };
  companyId: string;
  cnpj: string;
  /** Ultimo NSU processado (para busca incremental) */
  ultimoNSU?: string;
}

/**
 * Processador de Distribuicao DFe — busca automatica de NF-e na SEFAZ.
 *
 * Fluxo:
 * 1. Obtém certificado A1 descriptografado
 * 2. Monta SOAP envelope para NFeDistribuicaoDFe
 * 3. Envia request com mutual TLS (cert + key)
 * 4. Parsea response — extrai documentos (resNFe/procNFe)
 * 5. Decodifica docZip (base64 → gzip → XML)
 * 6. Enfileira XMLs no XmlProcessingProcessor
 */
@Processor(QUEUE_NAMES.NFE_DISTRIBUTION)
export class NfeDistributionProcessor extends WorkerHost {
  private readonly logger = new Logger(NfeDistributionProcessor.name);
  private readonly xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

  // Ambiente 1 = Producao, 2 = Homologacao
  private readonly SEFAZ_URL = 'https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx';
  private readonly SEFAZ_HOM_URL = 'https://hom1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx';

  constructor(
    @InjectModel(BuscaNfeLog.name) private logModel: Model<BuscaNfeLogDocument>,
    private readonly certificateService: CertificateService,
    @InjectQueue(QUEUE_NAMES.XML_PROCESSING) private xmlQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<NfeDistributionJobData>) {
    const { tenantContext: ctx, companyId, cnpj, ultimoNSU } = job.data;

    return tenantContext.run(ctx, async () => {
      const erros: string[] = [];
      let quantidadeEncontrada = 0;
      let quantidadeImportada = 0;
      let novoUltimoNSU = ultimoNSU || '0';

      try {
        // 1. Obter certificado descriptografado
        const { pfx, password } = await this.certificateService.getDecryptedPfx(companyId);

        // 2. Criar agente HTTPS com certificado mutual TLS
        const httpsAgent = new https.Agent({
          pfx,
          passphrase: password,
          rejectUnauthorized: true,
        });

        // 3. Consultar DFe em lotes (SEFAZ retorna max 50 docs por consulta)
        let hasMore = true;
        const allXmls: string[] = [];
        const allFileNames: string[] = [];

        while (hasMore) {
          const soapBody = this.buildDistDFeEnvelope(cnpj, novoUltimoNSU);
          const useHom = process.env.SEFAZ_AMBIENTE === '2';

          const response = await axios.post(
            useHom ? this.SEFAZ_HOM_URL : this.SEFAZ_URL,
            soapBody,
            {
              httpsAgent,
              headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                SOAPAction: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe/nfeDistDFeInteresse',
              },
              timeout: 30000,
            },
          );

          const parsed = this.xmlParser.parse(response.data);
          const retDistDFe = this.extractRetDistDFe(parsed);

          if (!retDistDFe) {
            erros.push('Resposta SEFAZ invalida');
            break;
          }

          const cStat = retDistDFe.cStat?.toString();
          if (cStat === '137' || cStat === '656') {
            // 137 = Nenhum documento localizado, 656 = Consumo indevido
            hasMore = false;
            continue;
          }

          if (cStat !== '138') {
            // 138 = Documento(s) localizado(s)
            erros.push(`SEFAZ cStat ${cStat}: ${retDistDFe.xMotivo || 'Erro desconhecido'}`);
            hasMore = false;
            continue;
          }

          // Extrair documentos
          const docs = Array.isArray(retDistDFe.loteDistDFeInt?.docZip)
            ? retDistDFe.loteDistDFeInt.docZip
            : retDistDFe.loteDistDFeInt?.docZip
              ? [retDistDFe.loteDistDFeInt.docZip]
              : [];

          for (const doc of docs) {
            const nsu = doc['@_NSU'] || doc.NSU;
            const schema = doc['@_schema'] || doc.schema || '';

            try {
              // Decodificar: base64 → gzip → XML
              const gzipBuffer = Buffer.from(doc['#text'] || doc, 'base64');
              const xmlContent = zlib.gunzipSync(gzipBuffer).toString('utf-8');

              // Apenas NF-e completas (procNFe ou resNFe)
              if (schema.includes('procNFe') || schema.includes('resNFe')) {
                allXmls.push(xmlContent);
                allFileNames.push(`NFe_NSU_${nsu}.xml`);
                quantidadeEncontrada++;
              }

              if (nsu) novoUltimoNSU = nsu;
            } catch (decodeErr) {
              erros.push(`Erro ao decodificar NSU ${nsu}: ${decodeErr}`);
            }
          }

          // Verificar se ha mais documentos
          const maxNSU = retDistDFe.maxNSU?.toString() || '0';
          const ultNSU = retDistDFe.ultNSU?.toString() || novoUltimoNSU;
          hasMore = parseInt(ultNSU) < parseInt(maxNSU);
          novoUltimoNSU = ultNSU;

          await job.updateProgress(hasMore ? 50 : 90);
        }

        // 4. Enfileirar XMLs para processamento (importacao fiscal)
        if (allXmls.length > 0) {
          await this.xmlQueue.add('import-dfe', {
            tenantContext: ctx,
            companyId,
            xmlContents: allXmls,
            fileNames: allFileNames,
          });
          quantidadeImportada = allXmls.length;
        }
      } catch (error) {
        erros.push(`Erro na distribuicao DFe: ${error.message || error}`);
        this.logger.error(`Erro DFe empresa ${companyId}: ${error}`);
      }

      // 5. Registrar log
      const log = await this.logModel.create({
        tenantId: ctx.tenantId,
        companyId,
        dataConsulta: new Date(),
        quantidadeEncontrada,
        quantidadeImportada,
        erros,
        ultimoNSU: novoUltimoNSU,
      });

      this.logger.log(
        `DFe ${cnpj}: ${quantidadeEncontrada} encontradas, ${quantidadeImportada} importadas`,
      );

      return {
        logId: log._id,
        quantidadeEncontrada,
        quantidadeImportada,
        ultimoNSU: novoUltimoNSU,
        erros,
      };
    });
  }

  private buildDistDFeEnvelope(cnpj: string, ultimoNSU: string): string {
    const tpAmb = process.env.SEFAZ_AMBIENTE === '2' ? '2' : '1';
    return `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
      <nfeDadosMsg>
        <distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
          <tpAmb>${tpAmb}</tpAmb>
          <cUFAutor>35</cUFAutor>
          <CNPJ>${cnpj}</CNPJ>
          <distNSU>
            <ultNSU>${ultimoNSU.padStart(15, '0')}</ultNSU>
          </distNSU>
        </distDFeInt>
      </nfeDadosMsg>
    </nfeDistDFeInteresse>
  </soap12:Body>
</soap12:Envelope>`;
  }

  private extractRetDistDFe(parsed: any): any {
    try {
      const envelope = parsed['soap:Envelope'] || parsed['soap12:Envelope'] || parsed;
      const body = envelope['soap:Body'] || envelope['soap12:Body'] || envelope;
      const response = body.nfeDistDFeInteresseResponse || body;
      const result = response.nfeDistDFeInteresseResult || response;
      return result.retDistDFeInt || result;
    } catch {
      return null;
    }
  }
}
