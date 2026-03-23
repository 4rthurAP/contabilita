import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { AssetsService } from './assets.service';
import { Company } from '../company/schemas/company.schema';
import { tenantContext } from '../tenant/tenant.context';

/**
 * Cron job para depreciacao automatica mensal.
 * Roda todo dia 1 as 5h: calcula depreciacao do mes anterior para todas as empresas.
 */
@Injectable()
export class AssetDepreciationScheduler {
  private readonly logger = new Logger(AssetDepreciationScheduler.name);

  constructor(
    @InjectModel(Company.name) private companyModel: Model<any>,
    private readonly assetsService: AssetsService,
  ) {}

  @Cron('0 5 1 * *')
  async handleMonthlyDepreciation() {
    this.logger.log('Iniciando depreciacao automatica mensal...');

    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    const companies = await this.companyModel.find({ isActive: true });

    let successCount = 0;
    let errorCount = 0;
    let totalAssets = 0;

    for (const company of companies) {
      try {
        await tenantContext.run(
          { tenantId: company.tenantId.toString(), userId: 'system', role: 'Admin' },
          async () => {
            const result = await this.assetsService.runMonthlyDepreciation(
              company._id.toString(),
              prevYear,
              prevMonth,
            );
            totalAssets += result.assetsDepreciated;
            successCount++;
          },
        );
      } catch (err) {
        errorCount++;
        this.logger.error(
          `Erro ao depreciar bens da empresa ${company.razaoSocial} (${company._id}): ${err}`,
        );
      }
    }

    this.logger.log(
      `Depreciacao mensal concluida: ${successCount} empresas, ${totalAssets} bens depreciados, ${errorCount} erros`,
    );
  }
}
