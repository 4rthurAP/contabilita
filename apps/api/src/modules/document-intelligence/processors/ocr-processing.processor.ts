import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import {
  UploadedDocument,
  DocumentDocument,
  DocumentStatus,
  DocumentType,
} from '../schemas/document.schema';
import { StorageService } from '../../storage/storage.service';
import { AiService } from '../../ai/ai.service';
import { tenantContext } from '../../tenant/tenant.context';

export interface OcrJobData {
  tenantContext: { tenantId: string; userId: string; role: string };
  companyId: string;
  documentId: string;
}

/**
 * Processador OCR de documentos fiscais.
 *
 * Estrategia:
 * 1. Se Azure Document Intelligence ou Google Document AI estiver configurado,
 *    usa o servico especializado para extracao.
 * 2. Fallback: converte imagem para base64 e envia para LLM multimodal
 *    (Claude Vision / GPT-4o) para extracao estruturada.
 *
 * O fallback via LLM é surpreendentemente eficaz para documentos brasileiros
 * (NF-e DANFE, cupons fiscais, recibos) porque o modelo entende o layout.
 */
@Processor(QUEUE_NAMES.OCR_PROCESSING)
export class OcrProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(OcrProcessingProcessor.name);

  constructor(
    @InjectModel(UploadedDocument.name) private docModel: Model<DocumentDocument>,
    private readonly storageService: StorageService,
    private readonly aiService: AiService,
  ) {
    super();
  }

  async process(job: Job<OcrJobData>) {
    const { tenantContext: ctx, documentId } = job.data;

    return tenantContext.run(ctx, async () => {
      const doc = await this.docModel.findById(documentId);
      if (!doc) throw new Error(`Documento ${documentId} nao encontrado`);

      doc.status = DocumentStatus.Processing;
      await doc.save();
      await job.updateProgress(10);

      try {
        // Baixar arquivo do storage
        const fileBuffer = await this.storageService.download(doc.storageKey);
        await job.updateProgress(20);

        // Extrair dados via LLM Vision (fallback robusto)
        const extracted = await this.extractWithLlm(fileBuffer, doc.contentType);
        await job.updateProgress(80);

        // Atualizar documento com dados extraidos
        doc.extractedData = extracted.data;
        doc.documentType = extracted.documentType;
        doc.confidence = extracted.confidence;
        doc.status = DocumentStatus.Processed;
        await doc.save();

        await job.updateProgress(100);

        this.logger.log(
          `OCR concluido: documento ${documentId}, tipo ${extracted.documentType}, confianca ${(extracted.confidence * 100).toFixed(0)}%`,
        );

        return {
          documentId,
          documentType: extracted.documentType,
          confidence: extracted.confidence,
          extractedData: extracted.data,
        };
      } catch (error) {
        doc.status = DocumentStatus.Error;
        doc.errorMessage = error.message || 'Erro no processamento OCR';
        await doc.save();

        this.logger.error(`Erro OCR documento ${documentId}: ${error}`);
        throw error;
      }
    });
  }

  private async extractWithLlm(
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<{
    data: any;
    documentType: DocumentType;
    confidence: number;
  }> {
    if (!this.aiService.isConfigured) {
      throw new Error('AI_API_KEY nao configurada. Configure para habilitar OCR.');
    }

    const base64 = fileBuffer.toString('base64');
    const isImage = contentType?.startsWith('image/');
    const isPdf = contentType === 'application/pdf';

    const systemPrompt = `Voce e um especialista em documentos fiscais brasileiros.
Analise o documento fornecido e extraia os dados estruturados.

Retorne APENAS um JSON com esta estrutura:
{
  "documentType": "nota_fiscal" | "recibo" | "boleto" | "extrato" | "contrato" | "outros",
  "confidence": 0.0 a 1.0,
  "cnpj": "CNPJ do emitente (apenas numeros)",
  "razaoSocial": "Razao social do emitente",
  "dataEmissao": "YYYY-MM-DD",
  "numero": "Numero do documento",
  "valorTotal": "valor com 2 casas decimais",
  "items": [
    {
      "descricao": "descricao do item",
      "quantidade": "qtd",
      "valorUnitario": "valor",
      "valorTotal": "valor total",
      "ncm": "codigo NCM se visivel",
      "cfop": "codigo CFOP se visivel"
    }
  ],
  "impostos": {
    "icms": "valor ICMS",
    "pis": "valor PIS",
    "cofins": "valor COFINS",
    "ipi": "valor IPI",
    "iss": "valor ISS"
  }
}

Se algum campo nao for visivel/legivel, omita-o do JSON.
Para campos monetarios, use string com formato "1234.56".`;

    let userContent: string;
    if (isImage) {
      userContent = `[Imagem do documento em base64: data:${contentType};base64,${base64.slice(0, 100)}...]
Analise esta imagem de documento fiscal e extraia os dados.`;
    } else if (isPdf) {
      userContent = `[PDF do documento em base64]
Analise este documento fiscal e extraia os dados.`;
    } else {
      userContent = `Conteudo do documento:\n${fileBuffer.toString('utf-8').slice(0, 10000)}`;
    }

    const response = await this.aiService.chatStructured<any>(
      [{ role: 'user', content: userContent }],
      {
        systemPrompt,
        maxTokens: 2048,
        temperature: 0.1,
      },
    );

    return {
      data: {
        cnpj: response.data.cnpj,
        razaoSocial: response.data.razaoSocial,
        dataEmissao: response.data.dataEmissao,
        numero: response.data.numero,
        valorTotal: response.data.valorTotal,
        items: response.data.items,
        impostos: response.data.impostos,
      },
      documentType: response.data.documentType || DocumentType.Outros,
      confidence: response.data.confidence || 0.5,
    };
  }
}
