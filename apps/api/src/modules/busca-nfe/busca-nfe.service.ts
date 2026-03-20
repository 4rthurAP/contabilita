import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BuscaNfeLog, BuscaNfeLogDocument } from './schemas/busca-nfe-log.schema';
import { requireCurrentTenant } from '../tenant/tenant.context';

@Injectable()
export class BuscaNfeService {
  constructor(
    @InjectModel(BuscaNfeLog.name) private buscaNfeLogModel: Model<BuscaNfeLogDocument>,
  ) {}

  /**
   * Consulta NF-e no ambiente SEFAZ via Distribuicao DFe.
   * TODO: Implementar integracao real com certificado digital A1/A3.
   * Por enquanto retorna stub indicando que a funcionalidade requer certificado.
   */
  async fetch(companyId: string) {
    const ctx = requireCurrentTenant();

    // Registrar tentativa de consulta
    const log = await this.buscaNfeLogModel.create({
      tenantId: ctx.tenantId,
      companyId,
      dataConsulta: new Date(),
      quantidadeEncontrada: 0,
      quantidadeImportada: 0,
      erros: ['Funcionalidade requer certificado digital. Configure o certificado A1 da empresa para habilitar a busca automatica de NF-e.'],
    });

    return {
      success: false,
      message: 'Busca de NF-e requer certificado digital A1 configurado para a empresa. Esta funcionalidade sera habilitada apos a configuracao do certificado.',
      logId: log._id,
      quantidadeEncontrada: 0,
      quantidadeImportada: 0,
    };
  }

  async getHistory(companyId: string) {
    const ctx = requireCurrentTenant();
    return this.buscaNfeLogModel
      .find({ tenantId: ctx.tenantId, companyId })
      .sort({ dataConsulta: -1 })
      .limit(50);
  }
}
