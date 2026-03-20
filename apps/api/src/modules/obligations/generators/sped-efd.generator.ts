import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Decimal from 'decimal.js';
import dayjs from 'dayjs';
import { Invoice, InvoiceDocument } from '../../fiscal/schemas/invoice.schema';
import { Company, CompanyDocument } from '../../company/schemas/company.schema';

/**
 * Gerador de arquivo SPED Fiscal (EFD ICMS/IPI).
 * Layout conforme Guia Pratico da EFD.
 *
 * Registros principais:
 * |0000| - Abertura
 * |0150| - Participantes
 * |C100| - NFs de mercadoria (modelo 55)
 * |C170| - Itens da NF
 * |E110| - Apuracao ICMS
 * |9999| - Encerramento
 */
@Injectable()
export class SpedEfdGenerator {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async generate(tenantId: string, companyId: string, year: number, month: number): Promise<string> {
    const company = await this.companyModel.findById(companyId);
    if (!company) throw new Error('Empresa nao encontrada');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const invoices = await this.invoiceModel
      .find({
        tenantId, companyId,
        dataEmissao: { $gte: startDate, $lte: endDate },
        status: 'escriturada',
      })
      .sort({ dataEmissao: 1 });

    const lines: string[] = [];
    let lineCount = 0;

    // |0000| - Abertura
    lines.push(
      `|0000|015|0|${dayjs(startDate).format('DDMMYYYY')}|${dayjs(endDate).format('DDMMYYYY')}|` +
      `${company.razaoSocial}|${company.cnpj}||${company.inscricaoEstadual || ''}|` +
      `${company.endereco?.codigoIbge || ''}|${company.endereco?.uf || ''}|||||A|1|`,
    );
    lineCount++;

    // |0200| - Tabela de itens (simplificado)
    const itemSet = new Set<string>();
    for (const inv of invoices) {
      for (const item of inv.items) {
        const key = item.ncm + item.descricao;
        if (!itemSet.has(key)) {
          itemSet.add(key);
          lines.push(
            `|0200|${item.ncm}|${item.descricao}|||${item.ncm}|00|||0|`,
          );
          lineCount++;
        }
      }
    }

    // Participantes (fornecedores/clientes)
    const participantSet = new Set<string>();
    for (const inv of invoices) {
      if (inv.fornecedorClienteCnpj && !participantSet.has(inv.fornecedorClienteCnpj)) {
        participantSet.add(inv.fornecedorClienteCnpj);
        lines.push(
          `|0150|${inv.fornecedorClienteCnpj}|${inv.fornecedorClienteNome || ''}|` +
          `||${inv.fornecedorClienteCnpj}|||||||||`,
        );
        lineCount++;
      }
    }

    // |C100| e |C170| - NFs e itens
    let totalIcmsDebito = new Decimal(0);
    let totalIcmsCredito = new Decimal(0);

    for (const inv of invoices) {
      const totalNota = new Decimal(inv.totalNota?.toString() || '0');
      const indOper = inv.tipo === 'saida' ? '1' : '0';

      lines.push(
        `|C100|${indOper}|1|${inv.fornecedorClienteCnpj || ''}|55|00|` +
        `${inv.serie}|${inv.numero}||${dayjs(inv.dataEmissao).format('DDMMYYYY')}|` +
        `${dayjs(inv.dataEmissao).format('DDMMYYYY')}|${totalNota.toFixed(2)}|0|0|` +
        `${totalNota.toFixed(2)}|9|0|0|${inv.totalIcms?.toString() || '0'}|0|0|` +
        `${inv.totalPis?.toString() || '0'}|${inv.totalCofins?.toString() || '0'}|` +
        `${inv.totalIpi?.toString() || '0'}|`,
      );
      lineCount++;

      // Itens
      let itemNum = 1;
      for (const item of inv.items) {
        const valorTotal = new Decimal(item.valorTotal?.toString() || '0');
        lines.push(
          `|C170|${itemNum}|${item.ncm}|${item.descricao}|${item.quantidade?.toString() || '0'}|UN|` +
          `${valorTotal.toFixed(2)}|0|0|${item.cfop}|||||||||||||`,
        );
        lineCount++;
        itemNum++;
      }

      // Acumular ICMS para apuracao
      const icms = new Decimal(inv.totalIcms?.toString() || '0');
      if (inv.tipo === 'saida') {
        totalIcmsDebito = totalIcmsDebito.plus(icms);
      } else {
        totalIcmsCredito = totalIcmsCredito.plus(icms);
      }
    }

    // |E110| - Apuracao ICMS
    const icmsRecolher = Decimal.max(totalIcmsDebito.minus(totalIcmsCredito), new Decimal(0));
    lines.push(
      `|E110|${totalIcmsDebito.toFixed(2)}|0|0|${totalIcmsDebito.toFixed(2)}|` +
      `${totalIcmsCredito.toFixed(2)}|0|0|${totalIcmsCredito.toFixed(2)}|0|` +
      `${icmsRecolher.toFixed(2)}|0|${icmsRecolher.toFixed(2)}|`,
    );
    lineCount++;

    // |9999| - Encerramento
    lines.push(`|9999|${lineCount + 1}|`);

    return lines.join('\r\n');
  }
}
