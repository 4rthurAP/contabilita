import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Decimal from 'decimal.js';
import dayjs from 'dayjs';
import { Account, AccountDocument } from '../../accounting/schemas/account.schema';
import { JournalEntry, JournalEntryDocument } from '../../accounting/schemas/journal-entry.schema';
import { Company, CompanyDocument } from '../../company/schemas/company.schema';

/**
 * Gerador de arquivo SPED Contabil (ECD).
 * Layout conforme Manual de Orientacao do Leiaute da ECD (ADE Cofis).
 *
 * Registros principais:
 * |0000| - Abertura
 * |0007| - Outras inscricoes
 * |I010| - Identificacao da escrituracao
 * |I050| - Plano de contas
 * |I155| - Saldos periodicos
 * |I200| - Lancamento contabil
 * |I250| - Partidas do lancamento
 * |9999| - Encerramento
 */
@Injectable()
export class SpedEcdGenerator {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    @InjectModel(JournalEntry.name) private entryModel: Model<JournalEntryDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async generate(tenantId: string, companyId: string, year: number): Promise<string> {
    const company = await this.companyModel.findById(companyId);
    if (!company) throw new Error('Empresa nao encontrada');

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const accounts = await this.accountModel
      .find({ tenantId, companyId })
      .sort({ codigo: 1 });

    const entries = await this.entryModel
      .find({ tenantId, companyId, date: { $gte: startDate, $lte: endDate } })
      .sort({ date: 1, numero: 1 })
      .populate('lines.accountId', 'codigo nome');

    const lines: string[] = [];
    let lineCount = 0;

    // |0000| - Abertura do arquivo
    lines.push(
      `|0000|LECD|${dayjs(startDate).format('DDMMYYYY')}|${dayjs(endDate).format('DDMMYYYY')}|` +
      `${company.razaoSocial}|${company.cnpj}||${company.inscricaoEstadual || ''}|` +
      `${company.endereco?.cidade || ''}|${company.endereco?.codigoIbge || ''}|` +
      `${company.endereco?.uf || ''}|||||G|0|N||N|`,
    );
    lineCount++;

    // |I010| - Identificacao da escrituracao contabil
    lines.push(`|I010|G|2.00|`);
    lineCount++;

    // |I050| - Plano de contas
    for (const acc of accounts) {
      const tipo = acc.isAnalytical ? 'A' : 'S';
      const natureza = acc.natureza === 'devedora' ? 'D' : 'C';
      lines.push(
        `|I050|${dayjs(startDate).format('DDMMYYYY')}|${acc.codigo}|` +
        `${acc.codigo}|${tipo}|${acc.nivel}|${acc.nome}|` +
        `${acc.codigoReferencialRfb || ''}|${natureza}|`,
      );
      lineCount++;
    }

    // |I200| e |I250| - Lancamentos contabeis
    for (const entry of entries) {
      lines.push(
        `|I200|${entry.numero}|${dayjs(entry.date).format('DDMMYYYY')}|` +
        `${entry.totalDebit?.toString() || '0'}|N|`,
      );
      lineCount++;

      for (const line of entry.lines) {
        const acc = line.accountId as any;
        const debit = new Decimal(line.debit?.toString() || '0');
        const credit = new Decimal(line.credit?.toString() || '0');
        const tipo = debit.gt(0) ? 'D' : 'C';
        const valor = debit.gt(0) ? debit : credit;

        lines.push(
          `|I250|${acc?.codigo || ''}|${acc?.codigo || ''}|${valor.toFixed(2)}|${tipo}|` +
          `${line.historico}|`,
        );
        lineCount++;
      }
    }

    // |9999| - Encerramento
    lines.push(`|9999|${lineCount + 1}|`);

    return lines.join('\r\n');
  }
}
