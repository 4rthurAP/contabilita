import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Decimal from 'decimal.js';
import { FixedAsset, FixedAssetDocument } from './schemas/fixed-asset.schema';
import { CreateAssetDto } from './dto/create-asset.dto';
import { requireCurrentTenant } from '../tenant/tenant.context';
import { StatusBem, MetodoDepreciacao } from '@contabilita/shared';

@Injectable()
export class AssetsService {
  constructor(
    @InjectModel(FixedAsset.name) private assetModel: Model<FixedAssetDocument>,
  ) {}

  async create(companyId: string, dto: CreateAssetDto) {
    const ctx = requireCurrentTenant();
    const valorAquisicao = new Decimal(dto.valorAquisicao);
    const valorResidual = new Decimal(dto.valorResidual || '0');

    const asset = await this.assetModel.create({
      ...dto,
      tenantId: ctx.tenantId,
      companyId,
      dataAquisicao: new Date(dto.dataAquisicao),
      valorAtual: valorAquisicao.toString(),
      depreciacaoAcumulada: '0',
      movimentacoes: [{
        date: new Date(dto.dataAquisicao),
        tipo: 'aquisicao',
        valor: valorAquisicao.toString(),
        descricao: `Aquisicao do bem ${dto.codigo}`,
      }],
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });

    return asset;
  }

  async findAll(companyId: string, status?: string) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, companyId };
    if (status) filter.status = status;
    return this.assetModel.find(filter).sort({ codigo: 1 });
  }

  async findById(companyId: string, id: string) {
    const ctx = requireCurrentTenant();
    const asset = await this.assetModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!asset) throw new NotFoundException('Bem nao encontrado');
    return asset;
  }

  /**
   * Executa depreciacao mensal para todos os bens ativos.
   */
  async runMonthlyDepreciation(companyId: string, year: number, month: number) {
    const ctx = requireCurrentTenant();
    const assets = await this.assetModel.find({
      tenantId: ctx.tenantId, companyId, status: StatusBem.Ativo,
    });

    const results = [];
    const referenceDate = new Date(year, month - 1, 1);

    for (const asset of assets) {
      const valorAquisicao = new Decimal(asset.valorAquisicao.toString());
      const valorResidual = new Decimal(asset.valorResidual?.toString() || '0');
      const deprecAcumulada = new Decimal(asset.depreciacaoAcumulada?.toString() || '0');
      const baseDepreciavel = valorAquisicao.minus(valorResidual);

      // Verifica se ja depreciou totalmente
      if (deprecAcumulada.gte(baseDepreciavel)) continue;

      // Verifica se o bem ja foi adquirido
      if (new Date(asset.dataAquisicao) > referenceDate) continue;

      let deprecMensal: Decimal;
      const taxa = new Decimal(asset.taxaDepreciacao.toString());

      if (asset.metodoDepreciacao === MetodoDepreciacao.Linear) {
        deprecMensal = baseDepreciavel.times(taxa).dividedBy(12).toDecimalPlaces(2);
      } else {
        // Saldo decrescente
        const valorAtual = new Decimal(asset.valorAtual?.toString() || '0');
        deprecMensal = valorAtual.times(taxa).dividedBy(12).toDecimalPlaces(2);
      }

      // Nao depreciar alem do valor residual
      const maxDeprec = baseDepreciavel.minus(deprecAcumulada);
      deprecMensal = Decimal.min(deprecMensal, maxDeprec);

      if (deprecMensal.isZero() || deprecMensal.isNegative()) continue;

      const novaDeprecAcum = deprecAcumulada.plus(deprecMensal);
      const novoValorAtual = valorAquisicao.minus(novaDeprecAcum);

      asset.depreciacaoAcumulada = novaDeprecAcum.toString() as any;
      asset.valorAtual = novoValorAtual.toString() as any;
      asset.movimentacoes.push({
        date: referenceDate,
        tipo: 'depreciacao',
        valor: deprecMensal.toString() as any,
        descricao: `Depreciacao ${String(month).padStart(2, '0')}/${year}`,
      } as any);

      await asset.save();
      results.push({
        assetId: asset._id,
        codigo: asset.codigo,
        descricao: asset.descricao,
        depreciacaoMensal: deprecMensal.toString(),
        depreciacaoAcumulada: novaDeprecAcum.toString(),
        valorAtual: novoValorAtual.toString(),
      });
    }

    return { period: `${month}/${year}`, assetsDepreciated: results.length, results };
  }

  /** Baixa do bem */
  async writeOff(companyId: string, id: string, motivo: string) {
    const ctx = requireCurrentTenant();
    const asset = await this.assetModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!asset) throw new NotFoundException('Bem nao encontrado');

    asset.status = StatusBem.Baixado;
    asset.movimentacoes.push({
      date: new Date(),
      tipo: 'baixa',
      valor: asset.valorAtual,
      descricao: motivo,
    } as any);
    asset.valorAtual = '0' as any;
    return asset.save();
  }

  /** Reavaliacao do bem */
  async revalue(companyId: string, id: string, novoValor: string, motivo: string) {
    const ctx = requireCurrentTenant();
    const asset = await this.assetModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
    if (!asset) throw new NotFoundException('Bem nao encontrado');

    const diferenca = new Decimal(novoValor).minus(new Decimal(asset.valorAtual?.toString() || '0'));
    asset.valorAtual = novoValor as any;
    asset.movimentacoes.push({
      date: new Date(),
      tipo: 'reavaliacao',
      valor: diferenca.toString() as any,
      descricao: motivo,
    } as any);
    return asset.save();
  }
}
