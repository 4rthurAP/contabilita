import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import { ReportsService } from '../reports.service';
import { GeneratedReport, GeneratedReportDocument } from '../schemas/generated-report.schema';
import { tenantContext, TenantContextData } from '../../tenant/tenant.context';

export interface ReportGenerationJobData {
  tenantContext: TenantContextData;
  companyId: string;
  reportType: 'balanco' | 'dre' | 'indicadores';
  params: Record<string, string>;
  title: string;
  requestedBy: string;
  reportId: string;
}

@Processor(QUEUE_NAMES.REPORT_GENERATION)
export class ReportGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportGenerationProcessor.name);

  constructor(
    private readonly reportsService: ReportsService,
    @InjectModel(GeneratedReport.name)
    private reportModel: Model<GeneratedReportDocument>,
  ) {
    super();
  }

  async process(job: Job<ReportGenerationJobData>): Promise<void> {
    const { tenantContext: ctx, companyId, reportType, params, reportId } = job.data;
    this.logger.log(`Gerando relatorio ${reportType} para empresa ${companyId}`);

    try {
      const data = await tenantContext.run(ctx, async () => {
        switch (reportType) {
          case 'balanco':
            return this.reportsService.getBalancoPatrimonial(companyId, params.endDate);
          case 'dre':
            return this.reportsService.getDRE(companyId, params.startDate, params.endDate);
          case 'indicadores':
            return this.reportsService.getIndicadores(companyId, params.endDate);
          default:
            throw new Error(`Tipo de relatorio desconhecido: ${reportType}`);
        }
      });

      await this.reportModel.findByIdAndUpdate(reportId, {
        data,
        status: 'concluido',
      });

      this.logger.log(`Relatorio ${reportType} gerado com sucesso (${reportId})`);
    } catch (error) {
      await this.reportModel.findByIdAndUpdate(reportId, {
        status: 'erro',
        errorMessage: error.message,
      });
      this.logger.error(`Falha ao gerar relatorio ${reportType}: ${error.message}`);
      throw error;
    }
  }
}
