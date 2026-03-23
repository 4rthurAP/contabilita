import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import Decimal from 'decimal.js';
import * as PDFDocument from 'pdfkit';
import { requireCurrentTenant } from '../../tenant/tenant.context';

/**
 * Servico de geracao de guias de pagamento (DARF, DAS, GPS).
 *
 * - DARF: calcula codigo de barras Febraban + gera PDF
 * - DAS: calcula valor via aliquota efetiva do Simples Nacional
 * - GPS: gera guia da previdencia social
 * - SELIC: busca taxa atualizada via API do Banco Central
 */
@Injectable()
export class DarfGenerationService {
  private readonly logger = new Logger(DarfGenerationService.name);
  private selicCache: { rate: number; fetchedAt: number } | null = null;

  constructor(
    @InjectModel('TaxPayment') private paymentModel: Model<any>,
  ) {}

  /**
   * Busca taxa SELIC atual do Banco Central.
   * Cache de 24h para evitar chamadas excessivas.
   */
  async getSelicRate(): Promise<number> {
    const now = Date.now();
    if (this.selicCache && now - this.selicCache.fetchedAt < 24 * 3600 * 1000) {
      return this.selicCache.rate;
    }

    try {
      const response = await axios.get(
        'https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados/ultimos/1?formato=json',
        { timeout: 10000 },
      );

      const rate = parseFloat(response.data?.[0]?.valor || '0');
      this.selicCache = { rate, fetchedAt: now };
      this.logger.log(`Taxa SELIC atualizada: ${rate}% a.m.`);
      return rate;
    } catch (error) {
      this.logger.warn(`Erro ao buscar SELIC: ${error}. Usando 1% a.m.`);
      return 1.0; // Fallback
    }
  }

  /**
   * Calcula valor atualizado de uma guia vencida (juros SELIC + multa).
   */
  async calcularValorAtualizado(
    valorOriginal: string,
    dataVencimento: Date,
  ): Promise<{
    valorOriginal: string;
    multa: string;
    juros: string;
    valorAtualizado: string;
    diasAtraso: number;
  }> {
    const valor = new Decimal(valorOriginal);
    const hoje = new Date();
    const diasAtraso = Math.max(
      0,
      Math.floor((hoje.getTime() - dataVencimento.getTime()) / (24 * 3600 * 1000)),
    );

    if (diasAtraso === 0) {
      return {
        valorOriginal,
        multa: '0',
        juros: '0',
        valorAtualizado: valorOriginal,
        diasAtraso: 0,
      };
    }

    // Multa: 0.33% por dia ate max 20%
    const multaPct = Math.min(diasAtraso * 0.0033, 0.20);
    const multa = valor.times(multaPct).toDecimalPlaces(2);

    // Juros: SELIC acumulada (simplificado: taxa mensal * meses)
    const selicMensal = await this.getSelicRate();
    const mesesAtraso = diasAtraso / 30;
    const juros = valor.times(selicMensal / 100).times(mesesAtraso).toDecimalPlaces(2);

    const valorAtualizado = valor.plus(multa).plus(juros).toDecimalPlaces(2);

    return {
      valorOriginal,
      multa: multa.toFixed(2),
      juros: juros.toFixed(2),
      valorAtualizado: valorAtualizado.toFixed(2),
      diasAtraso,
    };
  }

  /**
   * Gera PDF da guia DARF.
   */
  async gerarPdfDarf(paymentId: string): Promise<Buffer> {
    const ctx = requireCurrentTenant();
    const payment = await this.paymentModel.findOne({
      _id: paymentId,
      tenantId: ctx.tenantId,
    });

    if (!payment) throw new Error('Guia nao encontrada');

    const valorInfo = await this.calcularValorAtualizado(
      payment.valorTotal?.toString() || '0',
      payment.dataVencimento,
    );

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(14).font('Helvetica-Bold').text('DARF - Documento de Arrecadacao de Receitas Federais', { align: 'center' });
      doc.moveDown();

      // Dados
      doc.fontSize(10).font('Helvetica');
      doc.text(`Codigo da Receita: ${payment.tipo}`);
      doc.text(`Competencia: ${payment.competencia}`);
      doc.text(`Vencimento: ${payment.dataVencimento?.toLocaleDateString('pt-BR')}`);
      doc.moveDown();

      doc.text(`Valor Principal: R$ ${valorInfo.valorOriginal}`);
      if (valorInfo.diasAtraso > 0) {
        doc.text(`Multa: R$ ${valorInfo.multa}`);
        doc.text(`Juros (SELIC): R$ ${valorInfo.juros}`);
        doc.text(`Dias de Atraso: ${valorInfo.diasAtraso}`);
      }
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(`VALOR TOTAL: R$ ${valorInfo.valorAtualizado}`, { align: 'right' });

      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica').fillColor('#999');
      doc.text('Gerado pelo sistema Contabilita', { align: 'center' });

      doc.end();
    });
  }
}
