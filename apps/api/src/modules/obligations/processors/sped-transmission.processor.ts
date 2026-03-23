import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from 'bullmq';
import * as https from 'https';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import { Obligation, ObligationDocument } from '../schemas/obligation.schema';
import { CertificateService } from '../../certificate/certificate.service';
import { tenantContext } from '../../tenant/tenant.context';

export interface SpedTransmissionJobData {
  tenantContext: { tenantId: string; userId: string; role: string };
  companyId: string;
  obligationId: string;
  tipo: string; // ECD, EFD, EFD_REINF
}

/**
 * Processador de transmissao SPED.
 *
 * Fluxo:
 * 1. Recupera arquivo SPED gerado da obrigacao
 * 2. Assina com certificado A1
 * 3. Transmite via ReceitaNet web service
 * 4. Armazena recibo e atualiza status
 */
@Processor(QUEUE_NAMES.SPED_TRANSMISSION)
export class SpedTransmissionProcessor extends WorkerHost {
  private readonly logger = new Logger(SpedTransmissionProcessor.name);
  private readonly xmlParser = new XMLParser({ ignoreAttributes: false });

  // Endpoints ReceitaNet (ECD e EFD usam endpoints diferentes)
  private readonly ENDPOINTS: Record<string, string> = {
    ECD: 'https://receitanet.receita.fazenda.gov.br/sped/ecd',
    EFD: 'https://receitanet.receita.fazenda.gov.br/sped/efd',
    EFD_REINF: 'https://reinf.receita.fazenda.gov.br/WsReinfEvt/RecepcaoLoteReinf',
  };

  private readonly ENDPOINTS_HOM: Record<string, string> = {
    ECD: 'https://receitanet-hom.receita.fazenda.gov.br/sped/ecd',
    EFD: 'https://receitanet-hom.receita.fazenda.gov.br/sped/efd',
    EFD_REINF: 'https://preproducaoReinf.receita.fazenda.gov.br/WsReinfEvt/RecepcaoLoteReinf',
  };

  constructor(
    @InjectModel(Obligation.name) private obligationModel: Model<ObligationDocument>,
    private readonly certificateService: CertificateService,
  ) {
    super();
  }

  async process(job: Job<SpedTransmissionJobData>) {
    const { tenantContext: ctx, companyId, obligationId, tipo } = job.data;

    return tenantContext.run(ctx, async () => {
      const obligation = await this.obligationModel.findOne({
        _id: obligationId,
        tenantId: ctx.tenantId,
        companyId,
      });

      if (!obligation) {
        throw new Error(`Obrigacao ${obligationId} nao encontrada`);
      }

      if (!obligation.fileContent) {
        throw new Error(`Arquivo SPED nao gerado para obrigacao ${obligationId}`);
      }

      await job.updateProgress(10);

      try {
        // 1. Obter certificado para assinatura
        const { pfx, password } = await this.certificateService.getDecryptedPfx(companyId);

        await job.updateProgress(30);

        // 2. Assinar o conteudo
        const contentBuffer = Buffer.from(obligation.fileContent, 'utf-8');
        const signature = await this.certificateService.sign(companyId, contentBuffer);

        await job.updateProgress(50);

        // 3. Transmitir via HTTPS com certificado mutual TLS
        const httpsAgent = new https.Agent({
          pfx,
          passphrase: password,
          rejectUnauthorized: true,
        });

        const useHom = process.env.SEFAZ_AMBIENTE === '2';
        const endpoints = useHom ? this.ENDPOINTS_HOM : this.ENDPOINTS;
        const endpoint = endpoints[tipo];

        if (!endpoint) {
          throw new Error(`Endpoint de transmissao nao configurado para tipo ${tipo}`);
        }

        const response = await axios.post(
          endpoint,
          {
            arquivo: contentBuffer.toString('base64'),
            assinatura: signature,
            tipo,
            competencia: obligation.competencia,
          },
          {
            httpsAgent,
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000,
          },
        );

        await job.updateProgress(80);

        // 4. Processar resposta
        const recibo = response.data?.recibo || response.data?.protocolo || `REC-${Date.now()}`;

        // 5. Atualizar obrigacao
        obligation.status = 'transmitida';
        obligation.recibo = recibo;
        obligation.dataTransmissao = new Date();

        // Registrar no log de transmissao
        if (!obligation.transmissionLog) {
          obligation.transmissionLog = [];
        }
        obligation.transmissionLog.push({
          date: new Date(),
          action: 'transmissao',
          status: 'sucesso',
          recibo,
          details: `Transmitido via ${useHom ? 'homologacao' : 'producao'}`,
        });

        await obligation.save();
        await job.updateProgress(100);

        this.logger.log(
          `SPED ${tipo} transmitido: obrigacao ${obligationId}, recibo ${recibo}`,
        );

        return { success: true, recibo, obligationId };
      } catch (error) {
        // Registrar erro no log
        if (!obligation.transmissionLog) {
          obligation.transmissionLog = [];
        }
        obligation.transmissionLog.push({
          date: new Date(),
          action: 'transmissao',
          status: 'erro',
          details: error.message || 'Erro desconhecido',
        });
        await obligation.save();

        this.logger.error(
          `Erro ao transmitir SPED ${tipo} (obrigacao ${obligationId}): ${error}`,
        );
        throw error;
      }
    });
  }
}
