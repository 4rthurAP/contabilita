import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaxAssessmentService } from './services/tax-assessment.service';
import { TaxPaymentService } from './services/tax-payment.service';
import { Company } from '../company/schemas/company.schema';
import { tenantContext } from '../tenant/tenant.context';

/**
 * Cron jobs para apuracao fiscal automatica.
 * Roda no dia 1 de cada mes para apurar o mes anterior.
 */
@Injectable()
export class FiscalScheduler {
  private readonly logger = new Logger(FiscalScheduler.name);

  constructor(
    @InjectModel(Company.name) private companyModel: Model<any>,
    private taxAssessmentService: TaxAssessmentService,
    private taxPaymentService: TaxPaymentService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Apuracao fiscal mensal automatica.
   * Roda todo dia 1 as 6h: recalcula apuracao do mes anterior para todas as empresas ativas.
   */
  @Cron('0 6 1 * *')
  async handleMonthlyAssessment() {
    this.logger.log('Iniciando apuracao fiscal automatica mensal...');

    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // Mes anterior
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    // Buscar todas as empresas ativas (sem filtro de tenant — cron global)
    const companies = await this.companyModel.find({ isActive: true });

    let successCount = 0;
    let errorCount = 0;

    for (const company of companies) {
      try {
        // Executar no contexto do tenant da empresa
        await tenantContext.run(
          { tenantId: company.tenantId.toString(), userId: 'system', role: 'Admin' },
          async () => {
            // 1. Recalcular apuracao
            await this.taxAssessmentService.recalculate(
              company._id.toString(),
              prevYear,
              prevMonth,
            );

            // 2. Gerar guias de pagamento
            const payments = await this.taxPaymentService.generateFromAssessment(
              company._id.toString(),
              prevYear,
              prevMonth,
            );

            if (payments.length > 0) {
              this.eventEmitter.emit('tax.payment.generated', {
                tenantId: company.tenantId.toString(),
                companyId: company._id.toString(),
                payments: payments.map((p) => ({
                  tipo: p.tipo,
                  tipoGuia: p.tipoGuia,
                  valor: p.valorTotal?.toString(),
                  vencimento: p.dataVencimento,
                })),
              });
            }

            successCount++;
          },
        );
      } catch (err) {
        errorCount++;
        this.logger.error(
          `Erro ao apurar empresa ${company.razaoSocial} (${company._id}): ${err}`,
        );
      }
    }

    this.logger.log(
      `Apuracao mensal concluida: ${successCount} empresas ok, ${errorCount} com erro`,
    );
  }

  /**
   * Verifica guias vencidas diariamente as 7h30.
   * Atualiza status de guias pendentes cujo vencimento ja passou.
   */
  @Cron('0 30 7 * * *')
  async handleOverduePayments() {
    this.logger.log('Verificando guias vencidas...');

    const { TaxPayment } = await import('./schemas/tax-payment.schema');
    // Acesso direto via modelo inline (o modelo ja esta injetado no service)
    // Usamos EventEmitter para notificar sobre guias vencidas
    this.eventEmitter.emit('fiscal.check.overdue', { date: new Date() });
  }
}
