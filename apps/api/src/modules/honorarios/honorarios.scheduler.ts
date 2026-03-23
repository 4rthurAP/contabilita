import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Decimal from 'decimal.js';
import { ContratoService } from './services/contrato.service';
import { CobrancaService } from './services/cobranca.service';
import { Company } from '../company/schemas/company.schema';
import { Cobranca, CobrancaDocument } from './schemas/cobranca.schema';
import { NotificationService } from '../notification/notification.service';
import { tenantContext } from '../tenant/tenant.context';
import { StatusCobranca } from '@contabilita/shared';

/**
 * Scheduler para geracao automatica de cobrancas de honorarios.
 *
 * - Dia 5 as 6h: gera cobrancas mensais para todos os contratos ativos
 * - Dia 1 as 7h: verifica cobrancas vencidas e aplica juros/multa
 */
@Injectable()
export class HonorariosScheduler {
  private readonly logger = new Logger(HonorariosScheduler.name);

  constructor(
    @InjectModel(Company.name) private companyModel: Model<any>,
    @InjectModel(Cobranca.name) private cobrancaModel: Model<CobrancaDocument>,
    private readonly contratoService: ContratoService,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Gera cobrancas mensais para todos os contratos ativos.
   * Roda dia 5 de cada mes as 6h.
   */
  @Cron('0 6 5 * *')
  async handleMonthlyBilling() {
    this.logger.log('Gerando cobrancas mensais de honorarios...');

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const companies = await this.companyModel.find({ isActive: true });
    let totalGenerated = 0;

    for (const company of companies) {
      try {
        await tenantContext.run(
          { tenantId: company.tenantId.toString(), userId: 'system', role: 'Admin' },
          async () => {
            const result = await this.contratoService.gerarCobrancasMensais(
              company._id.toString(),
              year,
              month,
            );
            totalGenerated += result.cobrancasGeradas;

            // Notificar sobre novas cobrancas
            if (result.cobrancasGeradas > 0) {
              await this.notificationService.create({
                tenantId: company.tenantId.toString(),
                tipo: 'cobranca_gerada',
                titulo: `${result.cobrancasGeradas} cobranca(s) gerada(s)`,
                mensagem: `Cobrancas de honorarios ${String(month).padStart(2, '0')}/${year} geradas para ${company.razaoSocial}.`,
                link: '/honorarios/cobrancas',
              });

              // Enfileirar emails para clientes
              for (const cobranca of result.results) {
                await this.notificationService.enqueueEmail({
                  to: '', // Preenchido pelo processor com email do contato da empresa
                  subject: `[Contabilita] Fatura de Honorarios - ${String(month).padStart(2, '0')}/${year}`,
                  template: 'billing-invoice',
                  context: {
                    empresa: company.razaoSocial,
                    competencia: `${String(month).padStart(2, '0')}/${year}`,
                    valor: cobranca.valorTotal?.toString() || '0',
                    vencimento: cobranca.dataVencimento?.toLocaleDateString('pt-BR'),
                    link: '/portal/payments',
                  },
                });
              }
            }
          },
        );
      } catch (err) {
        this.logger.error(
          `Erro ao gerar cobrancas para ${company.razaoSocial}: ${err}`,
        );
      }
    }

    this.logger.log(`Cobrancas mensais: ${totalGenerated} geradas para ${companies.length} empresas`);
  }

  /**
   * Verifica cobrancas vencidas e aplica juros/multa.
   * Roda todo dia 1 as 7h.
   *
   * Regra padrao: multa 2% + juros 1% ao mes (pro-rata diario)
   */
  @Cron('0 7 1 * *')
  async handleOverdueBilling() {
    this.logger.log('Verificando cobrancas vencidas...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = await this.cobrancaModel.find({
      status: StatusCobranca.Pendente,
      dataVencimento: { $lt: today },
    });

    let updated = 0;

    for (const cobranca of overdue) {
      try {
        const valorPrincipal = new Decimal(cobranca.valorPrincipal?.toString() || '0');
        const diasAtraso = Math.floor(
          (today.getTime() - cobranca.dataVencimento.getTime()) / (24 * 3600 * 1000),
        );

        // Multa 2% + juros 1% ao mes (pro-rata diario)
        const multa = valorPrincipal.times('0.02');
        const jurosDiario = valorPrincipal.times('0.01').dividedBy(30);
        const jurosTotal = jurosDiario.times(diasAtraso).toDecimalPlaces(2);
        const novoTotal = valorPrincipal.plus(multa).plus(jurosTotal).toDecimalPlaces(2);

        cobranca.valorJuros = jurosTotal.toString() as any;
        cobranca.valorTotal = novoTotal.toString() as any;
        cobranca.status = StatusCobranca.Vencida;
        await cobranca.save();
        updated++;
      } catch (err) {
        this.logger.error(`Erro ao atualizar cobranca vencida ${cobranca._id}: ${err}`);
      }
    }

    if (updated > 0) {
      this.logger.log(`Cobrancas vencidas atualizadas: ${updated}`);
    }
  }
}
