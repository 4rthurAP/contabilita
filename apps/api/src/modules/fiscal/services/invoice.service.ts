import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Decimal from 'decimal.js';
import { XMLParser } from 'fast-xml-parser';
import { Invoice, InvoiceDocument } from '../schemas/invoice.schema';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { TaxCalculationFactory } from '../strategies/tax-calculation.factory';
import { requireCurrentTenant } from '../../tenant/tenant.context';
import { StatusNotaFiscal, TipoNotaFiscal, RegimeTributario } from '@contabilita/shared';
import { Company, CompanyDocument } from '../../company/schemas/company.schema';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    private taxFactory: TaxCalculationFactory,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(companyId: string, dto: CreateInvoiceDto) {
    const ctx = requireCurrentTenant();

    const company = await this.companyModel.findOne({
      _id: companyId,
      tenantId: ctx.tenantId,
    });
    if (!company) throw new NotFoundException('Empresa nao encontrada');

    const strategy = this.taxFactory.getStrategy(company.regimeTributario as RegimeTributario);

    // Calcular impostos por item e totais
    let totalProdutos = new Decimal(0);
    let totalIcms = new Decimal(0);
    let totalPis = new Decimal(0);
    let totalCofins = new Decimal(0);
    let totalIpi = new Decimal(0);
    let totalIss = new Decimal(0);

    const itemsWithTaxes = dto.items.map((item) => {
      const valorTotal = new Decimal(item.valorTotal);
      totalProdutos = totalProdutos.plus(valorTotal);

      // Determinar se e servico pelo CFOP (5933, 6933 = servicos)
      const isServico = item.cfop.startsWith('5933') || item.cfop.startsWith('6933') ||
        item.cfop.startsWith('1933') || item.cfop.startsWith('2933');

      const taxes = strategy.calculateItemTaxes({
        valorTotal,
        isServico,
        cfop: item.cfop,
        ncm: item.ncm,
      });

      // Acumular totais
      for (const tax of taxes) {
        const valor = new Decimal(tax.valor);
        switch (tax.tipo) {
          case 'icms': totalIcms = totalIcms.plus(valor); break;
          case 'pis': totalPis = totalPis.plus(valor); break;
          case 'cofins': totalCofins = totalCofins.plus(valor); break;
          case 'ipi': totalIpi = totalIpi.plus(valor); break;
          case 'iss': totalIss = totalIss.plus(valor); break;
        }
      }

      return {
        ...item,
        impostos: taxes,
      };
    });

    const totalNota = totalProdutos;

    const invoice = await this.invoiceModel.create({
      tenantId: ctx.tenantId,
      companyId,
      tipo: dto.tipo,
      numero: dto.numero,
      serie: dto.serie,
      dataEmissao: new Date(dto.dataEmissao),
      status: StatusNotaFiscal.Rascunho,
      fornecedorClienteNome: dto.fornecedorClienteNome,
      fornecedorClienteCnpj: dto.fornecedorClienteCnpj,
      items: itemsWithTaxes,
      totalProdutos: totalProdutos.toString(),
      totalNota: totalNota.toString(),
      totalIcms: totalIcms.toString(),
      totalPis: totalPis.toString(),
      totalCofins: totalCofins.toString(),
      totalIpi: totalIpi.toString(),
      totalIss: totalIss.toString(),
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });

    return invoice;
  }

  /** Escritura a nota fiscal (muda status e emite evento) */
  async post(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const invoice = await this.invoiceModel.findOne({
      _id: id,
      tenantId: ctx.tenantId,
      companyId,
    });
    if (!invoice) throw new NotFoundException('Nota fiscal nao encontrada');

    if (invoice.status !== StatusNotaFiscal.Rascunho) {
      throw new BadRequestException('Nota fiscal ja foi escriturada ou cancelada');
    }

    invoice.status = StatusNotaFiscal.Escriturada;
    await invoice.save();

    // Emitir evento para integracao com contabilidade e apuracao fiscal
    this.eventEmitter.emit('invoice.posted', {
      invoiceId: invoice._id.toString(),
      tenantId: ctx.tenantId,
      companyId,
      tipo: invoice.tipo,
      dataEmissao: invoice.dataEmissao,
      totalNota: invoice.totalNota?.toString(),
      totalIcms: invoice.totalIcms?.toString(),
      totalPis: invoice.totalPis?.toString(),
      totalCofins: invoice.totalCofins?.toString(),
      totalIpi: invoice.totalIpi?.toString(),
      totalIss: invoice.totalIss?.toString(),
    });

    return invoice;
  }

  /** Importa NF-e a partir de XML */
  async importXml(companyId: string, xml: string) {
    const ctx = requireCurrentTenant();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const parsed = parser.parse(xml);

    // Navegar na estrutura do XML da NF-e
    const nfe = parsed?.nfeProc?.NFe?.infNFe || parsed?.NFe?.infNFe;
    if (!nfe) throw new BadRequestException('XML invalido: estrutura NFe nao encontrada');

    const ide = nfe.ide;
    const emit = nfe.emit;
    const dest = nfe.dest;
    const det = Array.isArray(nfe.det) ? nfe.det : [nfe.det];

    // Determinar se e entrada ou saida baseado no CNPJ
    const company = await this.companyModel.findOne({
      _id: companyId,
      tenantId: ctx.tenantId,
    });
    if (!company) throw new NotFoundException('Empresa nao encontrada');

    const isEntrada = emit.CNPJ !== company.cnpj;

    const items = det.map((d: any) => {
      const prod = d.prod;
      const imposto = d.imposto;

      const impostos = [];
      // Extrair ICMS
      const icms = imposto?.ICMS;
      if (icms) {
        const icmsData = Object.values(icms)[0] as any;
        if (icmsData?.vICMS) {
          impostos.push({
            tipo: 'icms',
            baseCalculo: icmsData.vBC || '0',
            aliquota: icmsData.pICMS || '0',
            valor: icmsData.vICMS,
          });
        }
      }

      // Extrair PIS
      const pis = imposto?.PIS;
      if (pis) {
        const pisData = Object.values(pis)[0] as any;
        if (pisData?.vPIS) {
          impostos.push({
            tipo: 'pis',
            baseCalculo: pisData.vBC || '0',
            aliquota: pisData.pPIS || '0',
            valor: pisData.vPIS,
          });
        }
      }

      // Extrair COFINS
      const cofins = imposto?.COFINS;
      if (cofins) {
        const cofinsData = Object.values(cofins)[0] as any;
        if (cofinsData?.vCOFINS) {
          impostos.push({
            tipo: 'cofins',
            baseCalculo: cofinsData.vBC || '0',
            aliquota: cofinsData.pCOFINS || '0',
            valor: cofinsData.vCOFINS,
          });
        }
      }

      return {
        descricao: prod.xProd,
        ncm: prod.NCM || '',
        cfop: prod.CFOP || '',
        quantidade: String(prod.qCom || prod.qTrib || '1'),
        valorUnitario: String(prod.vUnCom || prod.vUnTrib || '0'),
        valorTotal: String(prod.vProd || '0'),
        impostos,
      };
    });

    const chaveAcesso = nfe['@_Id']?.replace('NFe', '') || '';

    // Verificar duplicidade pela chave de acesso
    if (chaveAcesso) {
      const existing = await this.invoiceModel.findOne({ chaveAcesso });
      if (existing) throw new ConflictException('NF-e ja importada (chave de acesso duplicada)');
    }

    return this.invoiceModel.create({
      tenantId: ctx.tenantId,
      companyId,
      tipo: isEntrada ? TipoNotaFiscal.Entrada : TipoNotaFiscal.Saida,
      numero: String(ide.nNF),
      serie: String(ide.serie),
      dataEmissao: new Date(ide.dhEmi || ide.dEmi),
      status: StatusNotaFiscal.Rascunho,
      fornecedorClienteNome: isEntrada ? emit.xNome : dest?.xNome,
      fornecedorClienteCnpj: isEntrada ? emit.CNPJ : dest?.CNPJ,
      items,
      totalProdutos: String(nfe.total?.ICMSTot?.vProd || '0'),
      totalNota: String(nfe.total?.ICMSTot?.vNF || '0'),
      totalIcms: String(nfe.total?.ICMSTot?.vICMS || '0'),
      totalPis: String(nfe.total?.ICMSTot?.vPIS || '0'),
      totalCofins: String(nfe.total?.ICMSTot?.vCOFINS || '0'),
      totalIpi: String(nfe.total?.ICMSTot?.vIPI || '0'),
      totalIss: '0',
      xmlOriginal: xml,
      chaveAcesso,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
  }

  async findAll(companyId: string, page = 1, limit = 20, tipo?: string) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, companyId };
    if (tipo) filter.tipo = tipo;

    const [data, total] = await Promise.all([
      this.invoiceModel.find(filter).sort({ dataEmissao: -1 }).skip((page - 1) * limit).limit(limit),
      this.invoiceModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const invoice = await this.invoiceModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!invoice) throw new NotFoundException('Nota fiscal nao encontrada');
    return invoice;
  }

  async cancel(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const invoice = await this.invoiceModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!invoice) throw new NotFoundException('Nota fiscal nao encontrada');
    invoice.status = StatusNotaFiscal.Cancelada;
    return invoice.save();
  }
}
