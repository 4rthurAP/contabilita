import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from 'bullmq';
import axios from 'axios';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import { Certidao, CertidaoDocument, CertidaoTipo, CertidaoStatus } from '../schemas/certidao.schema';
import { StorageService } from '../../storage/storage.service';
import { tenantContext } from '../../tenant/tenant.context';

export interface CertidaoFetchJobData {
  tenantContext: { tenantId: string; userId: string; role: string };
  companyId: string;
  cnpj: string;
  tipos: CertidaoTipo[];
}

/**
 * Processador de busca automatica de certidoes.
 *
 * Consulta portais governamentais:
 * - CND Federal: servicos.receita.fazenda.gov.br
 * - CRF FGTS: consulta-crf.caixa.gov.br
 * - CNDT: cndt-certidao.tst.jus.br
 */
@Processor(QUEUE_NAMES.CERTIDAO_FETCH)
export class CertidaoFetchProcessor extends WorkerHost {
  private readonly logger = new Logger(CertidaoFetchProcessor.name);

  constructor(
    @InjectModel(Certidao.name) private certidaoModel: Model<CertidaoDocument>,
    private readonly storageService: StorageService,
  ) {
    super();
  }

  async process(job: Job<CertidaoFetchJobData>) {
    const { tenantContext: ctx, companyId, cnpj, tipos } = job.data;

    return tenantContext.run(ctx, async () => {
      const results: Array<{ tipo: string; status: string; validade?: string }> = [];

      for (let i = 0; i < tipos.length; i++) {
        const tipo = tipos[i];
        try {
          const result = await this.fetchCertidao(ctx.tenantId, companyId, cnpj, tipo);
          results.push(result);
        } catch (error) {
          results.push({ tipo, status: 'erro' });
          this.logger.error(`Erro ao buscar ${tipo} para CNPJ ${cnpj}: ${error}`);
        }
        await job.updateProgress(Math.round(((i + 1) / tipos.length) * 100));
      }

      return { cnpj, results };
    });
  }

  private async fetchCertidao(
    tenantId: string,
    companyId: string,
    cnpj: string,
    tipo: CertidaoTipo,
  ): Promise<{ tipo: string; status: string; validade?: string }> {
    const cleanCnpj = cnpj.replace(/\D/g, '');

    // Cada tipo tem um endpoint e parsing diferente
    switch (tipo) {
      case CertidaoTipo.CndFederal:
        return this.fetchCndFederal(tenantId, companyId, cleanCnpj);
      case CertidaoTipo.CrfFgts:
        return this.fetchCrfFgts(tenantId, companyId, cleanCnpj);
      case CertidaoTipo.Cndt:
        return this.fetchCndt(tenantId, companyId, cleanCnpj);
      default:
        return { tipo, status: 'nao_implementado' };
    }
  }

  private async fetchCndFederal(tenantId: string, companyId: string, cnpj: string) {
    try {
      // Consulta via API publica da Receita Federal
      const response = await axios.get(
        `https://servicos.receita.fazenda.gov.br/servicos/certidaointernet/cnpj/emitir`,
        {
          params: { cnpj },
          timeout: 30000,
          responseType: 'arraybuffer',
          headers: { 'User-Agent': 'Contabilita/1.0' },
        },
      );

      // Se retornou PDF, armazenar
      const isPdf = response.headers['content-type']?.includes('pdf');
      let pdfKey: string | undefined;
      if (isPdf) {
        pdfKey = await this.storageService.upload(Buffer.from(response.data), {
          tenantId,
          folder: 'certidoes',
          fileName: `CND_Federal_${cnpj}_${Date.now()}.pdf`,
          contentType: 'application/pdf',
        });
      }

      // Upsert certidao
      const validade = new Date(Date.now() + 180 * 24 * 3600 * 1000); // 180 dias padrao
      await this.certidaoModel.findOneAndUpdate(
        { tenantId, companyId, tipo: CertidaoTipo.CndFederal },
        {
          status: isPdf ? CertidaoStatus.Valida : CertidaoStatus.NaoEmitida,
          dataEmissao: new Date(),
          dataValidade: validade,
          pdfStorageKey: pdfKey,
        },
        { upsert: true, new: true },
      );

      return {
        tipo: CertidaoTipo.CndFederal,
        status: isPdf ? 'valida' : 'nao_emitida',
        validade: validade.toISOString(),
      };
    } catch (error) {
      // Se nao conseguiu, marcar como nao emitida
      await this.certidaoModel.findOneAndUpdate(
        { tenantId, companyId, tipo: CertidaoTipo.CndFederal },
        {
          status: CertidaoStatus.NaoEmitida,
          observacao: `Erro na consulta: ${error.message}`,
        },
        { upsert: true },
      );
      return { tipo: CertidaoTipo.CndFederal, status: 'erro' };
    }
  }

  private async fetchCrfFgts(tenantId: string, companyId: string, cnpj: string) {
    try {
      const response = await axios.get(
        `https://consulta-crf.caixa.gov.br/consultacrf/pages/consultaEmpregador.jsf`,
        {
          params: { cnpj },
          timeout: 30000,
          headers: { 'User-Agent': 'Contabilita/1.0' },
        },
      );

      const isRegular = response.data?.toString()?.includes('REGULAR');
      const validade = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 30 dias

      await this.certidaoModel.findOneAndUpdate(
        { tenantId, companyId, tipo: CertidaoTipo.CrfFgts },
        {
          status: isRegular ? CertidaoStatus.Valida : CertidaoStatus.Positiva,
          dataEmissao: new Date(),
          dataValidade: validade,
        },
        { upsert: true },
      );

      return { tipo: CertidaoTipo.CrfFgts, status: isRegular ? 'valida' : 'positiva' };
    } catch {
      return { tipo: CertidaoTipo.CrfFgts, status: 'erro' };
    }
  }

  private async fetchCndt(tenantId: string, companyId: string, cnpj: string) {
    try {
      const response = await axios.get(
        `https://cndt-certidao.tst.jus.br/gerarCertidao`,
        {
          params: { tipo: 'cnpj', consulta: cnpj },
          timeout: 30000,
          headers: { 'User-Agent': 'Contabilita/1.0' },
        },
      );

      const validade = new Date(Date.now() + 180 * 24 * 3600 * 1000);

      await this.certidaoModel.findOneAndUpdate(
        { tenantId, companyId, tipo: CertidaoTipo.Cndt },
        {
          status: CertidaoStatus.Valida,
          dataEmissao: new Date(),
          dataValidade: validade,
        },
        { upsert: true },
      );

      return { tipo: CertidaoTipo.Cndt, status: 'valida', validade: validade.toISOString() };
    } catch {
      return { tipo: CertidaoTipo.Cndt, status: 'erro' };
    }
  }
}
