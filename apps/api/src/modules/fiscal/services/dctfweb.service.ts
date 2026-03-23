import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Decimal from 'decimal.js';
import { requireCurrentTenant } from '../../tenant/tenant.context';

/**
 * Servico de geracao de dados DCTFWeb.
 *
 * Agrega debitos previdenciarios (eSocial S-1200) e retencoes (EFD-Reinf)
 * para gerar os valores que compoem a DCTFWeb e os DARFs correspondentes.
 *
 * Codigos de receita gerados:
 * - 1082: Contribuicao previdenciaria (INSS empregador)
 * - 1708: IRRF sobre servicos
 * - 5952: PIS/COFINS/CSLL retidos (4,65%)
 */
@Injectable()
export class DctfWebService {
  private readonly logger = new Logger(DctfWebService.name);

  constructor(
    @InjectModel('EsocialEvent') private esocialModel: Model<any>,
    @InjectModel('Obligation') private obligationModel: Model<any>,
    @InjectModel('TaxPayment') private paymentModel: Model<any>,
  ) {}

  /**
   * Gera resumo DCTFWeb para uma competencia.
   * Consolida debitos do eSocial + retencoes da Reinf.
   */
  async generate(companyId: string, year: number, month: number) {
    const ctx = requireCurrentTenant();
    const competencia = `${String(month).padStart(2, '0')}/${year}`;

    // 1. Debitos previdenciarios (eSocial)
    const esocialEvents = await this.esocialModel.find({
      tenantId: ctx.tenantId,
      companyId,
      tipo: 'S-1200',
      competencia,
      status: 'processado',
    });

    let totalInssEmpregador = new Decimal(0);
    let totalInssDescontado = new Decimal(0);
    let totalFgts = new Decimal(0);

    // Agregar valores dos eventos S-1200 (simplificado)
    for (const evt of esocialEvents) {
      // Em producao, extrair do XML processado
      // Aqui usamos estimativa: 20% patronal + 8% FGTS
      const salarioBruto = new Decimal('3000'); // Placeholder
      totalInssEmpregador = totalInssEmpregador.plus(salarioBruto.times('0.20'));
      totalFgts = totalFgts.plus(salarioBruto.times('0.08'));
    }

    // 2. Retencoes (EFD-Reinf) — buscar da obrigacao gerada
    const reinfObl = await this.obligationModel.findOne({
      tenantId: ctx.tenantId,
      companyId,
      tipo: 'EFD_REINF',
      competencia,
      status: { $in: ['gerada', 'transmitida'] },
    });

    let totalRetencaoInss = new Decimal(0);
    let totalRetencaoPcc = new Decimal(0);
    let totalRetencaoIrrf = new Decimal(0);

    if (reinfObl?.fileContent) {
      // Extrair totais do XML Reinf (simplificado)
      const content = reinfObl.fileContent;
      const inssMatch = content.match(/vlrTotalRetPrinc>(\d+\.?\d*)</);
      const irrfMatch = content.match(/vlrIR>(\d+\.?\d*)</);
      if (inssMatch) totalRetencaoInss = new Decimal(inssMatch[1]);
      if (irrfMatch) totalRetencaoIrrf = new Decimal(irrfMatch[1]);
    }

    // 3. Gerar DARFs
    const darfs = [
      {
        codigoReceita: '1082',
        descricao: 'Contribuicao Previdenciaria - INSS Empregador',
        valor: totalInssEmpregador.toFixed(2),
        vencimento: new Date(year, month, 20), // Dia 20 do mes seguinte
      },
      {
        codigoReceita: '1708',
        descricao: 'IRRF sobre Servicos',
        valor: totalRetencaoIrrf.toFixed(2),
        vencimento: new Date(year, month, 20),
      },
      {
        codigoReceita: '5952',
        descricao: 'PIS/COFINS/CSLL Retidos (4,65%)',
        valor: totalRetencaoPcc.toFixed(2),
        vencimento: new Date(year, month, 20),
      },
    ].filter((d) => new Decimal(d.valor).gt(0));

    // 4. Criar guias de pagamento
    for (const darf of darfs) {
      await this.paymentModel.findOneAndUpdate(
        {
          tenantId: ctx.tenantId,
          companyId,
          tipo: darf.codigoReceita,
          competencia,
        },
        {
          tipoGuia: 'DARF',
          tipo: darf.codigoReceita,
          descricao: darf.descricao,
          competencia,
          dataVencimento: darf.vencimento,
          valorTotal: darf.valor,
          status: 'pendente',
          updatedBy: ctx.userId,
        },
        { upsert: true, new: true },
      );
    }

    // 5. Atualizar obrigacao DCTFWeb
    await this.obligationModel.findOneAndUpdate(
      { tenantId: ctx.tenantId, companyId, tipo: 'DCTFWEB', competencia },
      {
        status: 'gerada',
        fileName: `DCTFWEB_${competencia.replace('/', '_')}.json`,
        fileContent: JSON.stringify({ darfs, competencia, totalInssEmpregador: totalInssEmpregador.toFixed(2), totalFgts: totalFgts.toFixed(2) }),
        updatedBy: ctx.userId,
      },
      { upsert: true },
    );

    this.logger.log(`DCTFWeb ${competencia}: ${darfs.length} DARFs gerados`);

    return { competencia, darfs, totalInssEmpregador: totalInssEmpregador.toFixed(2), totalFgts: totalFgts.toFixed(2) };
  }
}
