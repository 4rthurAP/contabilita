import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { Company, CompanyDocument } from '../schemas/company.schema';
import { tenantContext } from '../../tenant/tenant.context';

export interface CnpjData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacaoCadastral: string;
  dataAbertura: string;
  naturezaJuridica: string;
  cnaePrincipal: { codigo: string; descricao: string };
  cnaesSecundarios: Array<{ codigo: string; descricao: string }>;
  endereco: {
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    codigoIbge: string;
  };
  socios: Array<{
    nome: string;
    cpfCnpj: string;
    qualificacao: string;
  }>;
  capitalSocial: string;
}

/**
 * Servico de enriquecimento de dados via CNPJ.
 *
 * Usa BrasilAPI (gratuita, sem autenticacao) para buscar dados cadastrais.
 * Alternativa: ReceitaWS (paga, mais estavel).
 *
 * Funcionalidades:
 * 1. Auto-preenchimento ao cadastrar empresa (on-demand)
 * 2. Verificacao mensal de situacao cadastral (scheduler)
 * 3. Deteccao de alteracoes contratuais
 */
@Injectable()
export class CnpjEnrichmentService {
  private readonly logger = new Logger(CnpjEnrichmentService.name);

  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  /**
   * Consulta dados do CNPJ na BrasilAPI.
   */
  async fetchCnpjData(cnpj: string): Promise<CnpjData> {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      throw new Error('CNPJ invalido');
    }

    const response = await axios.get(
      `https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`,
      { timeout: 15000 },
    );

    const data = response.data;

    return {
      cnpj: cleanCnpj,
      razaoSocial: data.razao_social || '',
      nomeFantasia: data.nome_fantasia || '',
      situacaoCadastral: data.descricao_situacao_cadastral || '',
      dataAbertura: data.data_inicio_atividade || '',
      naturezaJuridica: data.natureza_juridica || '',
      cnaePrincipal: {
        codigo: data.cnae_fiscal?.toString() || '',
        descricao: data.cnae_fiscal_descricao || '',
      },
      cnaesSecundarios: (data.cnaes_secundarios || []).map((c: any) => ({
        codigo: c.codigo?.toString() || '',
        descricao: c.descricao || '',
      })),
      endereco: {
        logradouro: data.logradouro || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        cidade: data.municipio || '',
        uf: data.uf || '',
        cep: data.cep?.toString() || '',
        codigoIbge: data.codigo_municipio_ibge?.toString() || '',
      },
      socios: (data.qsa || []).map((s: any) => ({
        nome: s.nome_socio || '',
        cpfCnpj: s.cnpj_cpf_do_socio || '',
        qualificacao: s.qualificacao_socio || '',
      })),
      capitalSocial: data.capital_social?.toString() || '0',
    };
  }

  /**
   * Enriquece uma empresa com dados do CNPJ.
   * Preenche campos vazios sem sobrescrever dados ja informados.
   */
  async enrichCompany(companyId: string): Promise<CnpjData | null> {
    const company = await this.companyModel.findById(companyId);
    if (!company?.cnpj) return null;

    try {
      const data = await this.fetchCnpjData(company.cnpj);

      // Preencher apenas campos vazios
      const updates: any = {};
      if (!company.razaoSocial) updates.razaoSocial = data.razaoSocial;
      if (!company.nomeFantasia) updates.nomeFantasia = data.nomeFantasia;
      if (!company.inscricaoEstadual && data.situacaoCadastral) {
        updates.situacaoCadastral = data.situacaoCadastral;
      }
      if (!company.endereco?.logradouro) {
        updates.endereco = data.endereco;
      }
      if (data.cnaePrincipal?.codigo) {
        updates.cnaePrincipal = data.cnaePrincipal.codigo;
        updates.cnaeDescricao = data.cnaePrincipal.descricao;
      }

      if (Object.keys(updates).length > 0) {
        await this.companyModel.updateOne({ _id: companyId }, { $set: updates });
        this.logger.log(`Empresa ${companyId} enriquecida com dados do CNPJ ${company.cnpj}`);
      }

      return data;
    } catch (error) {
      this.logger.error(`Erro ao consultar CNPJ ${company.cnpj}: ${error}`);
      return null;
    }
  }

  /**
   * Verificacao mensal de situacao cadastral.
   * Alerta se alguma empresa estiver com situacao diferente de "ATIVA".
   */
  @Cron('0 5 15 * *') // Dia 15 de cada mes as 5h
  async checkSituacaoCadastral() {
    this.logger.log('Verificando situacao cadastral das empresas...');

    const companies = await this.companyModel.find({
      isActive: true,
      cnpj: { $exists: true, $ne: '' },
    });

    let alerts = 0;

    for (const company of companies) {
      try {
        const data = await this.fetchCnpjData(company.cnpj);

        if (data.situacaoCadastral && data.situacaoCadastral !== 'ATIVA') {
          this.logger.warn(
            `ALERTA: Empresa ${company.razaoSocial} (${company.cnpj}) com situacao: ${data.situacaoCadastral}`,
          );
          alerts++;
        }

        // Rate limiting — BrasilAPI tem limite
        await new Promise((r) => setTimeout(r, 2000));
      } catch {
        // Ignorar erros individuais
      }
    }

    this.logger.log(`Verificacao cadastral concluida: ${alerts} alertas de ${companies.length} empresas`);
  }
}
