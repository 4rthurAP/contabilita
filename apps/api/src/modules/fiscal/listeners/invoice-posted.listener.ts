import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TaxAssessmentService } from '../services/tax-assessment.service';

export interface InvoicePostedEvent {
  invoiceId: string;
  tenantId: string;
  companyId: string;
  tipo: string;
  dataEmissao: Date;
  totalNota: string;
  totalIcms: string;
  totalPis: string;
  totalCofins: string;
  totalIpi: string;
  totalIss: string;
}

/**
 * Listener que recalcula a apuracao fiscal quando uma NF e escriturada.
 * Futuramente tambem gerara o lancamento contabil automatico.
 */
@Injectable()
export class InvoicePostedListener {
  constructor(private taxAssessmentService: TaxAssessmentService) {}

  @OnEvent('invoice.posted')
  async handle(event: InvoicePostedEvent) {
    const date = new Date(event.dataEmissao);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Recalcular apuracao do mes
    await this.taxAssessmentService.recalculate(event.companyId, year, month);
  }
}
