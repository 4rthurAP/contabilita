import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import { InvoiceService } from '../services/invoice.service';
import { tenantContext, TenantContextData } from '../../tenant/tenant.context';

export interface XmlProcessingJobData {
  tenantContext: TenantContextData;
  companyId: string;
  xmlContents: string[];
  fileNames?: string[];
}

export interface XmlProcessingResult {
  total: number;
  success: number;
  errors: { index: number; fileName?: string; error: string }[];
}

@Processor(QUEUE_NAMES.XML_PROCESSING)
export class XmlProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(XmlProcessingProcessor.name);

  constructor(private readonly invoiceService: InvoiceService) {
    super();
  }

  async process(job: Job<XmlProcessingJobData>): Promise<XmlProcessingResult> {
    const { tenantContext: ctx, companyId, xmlContents, fileNames } = job.data;
    this.logger.log(`Processando ${xmlContents.length} XMLs para empresa ${companyId}`);

    const result: XmlProcessingResult = { total: xmlContents.length, success: 0, errors: [] };

    for (let i = 0; i < xmlContents.length; i++) {
      try {
        await tenantContext.run(ctx, async () => {
          await this.invoiceService.importXml(companyId, xmlContents[i]);
        });
        result.success++;
        await job.updateProgress(Math.round(((i + 1) / xmlContents.length) * 100));
      } catch (error) {
        result.errors.push({
          index: i,
          fileName: fileNames?.[i],
          error: error.message,
        });
        this.logger.warn(`Erro ao processar XML ${fileNames?.[i] ?? i}: ${error.message}`);
      }
    }

    this.logger.log(`XML processing finalizado: ${result.success}/${result.total} sucesso`);
    return result;
  }
}
