import { Injectable, BadRequestException } from '@nestjs/common';

export interface ParsedTransaction {
  fitid: string;
  date: Date;
  amount: number;
  memo: string;
  type: string;
}

export interface ParsedOfxResult {
  bankId: string;
  accountId: string;
  accountType: string;
  startDate: Date;
  endDate: Date;
  transactions: ParsedTransaction[];
}

/**
 * Parser para arquivos OFX (Open Financial Exchange).
 * Suporta OFX 1.x (SGML) e OFX 2.x (XML).
 *
 * OFX 1.x nao e XML valido — usa tags SGML sem fechamento.
 * O parser converte SGML para pseudo-XML antes de processar.
 */
@Injectable()
export class OfxParserService {
  parse(content: string): ParsedOfxResult {
    const normalized = this.normalizeOfx(content);

    const bankId = this.extractTag(normalized, 'BANKID') || '';
    const accountId = this.extractTag(normalized, 'ACCTID') || '';
    const accountType = this.extractTag(normalized, 'ACCTTYPE') || 'CHECKING';

    const startDateStr = this.extractTag(normalized, 'DTSTART');
    const endDateStr = this.extractTag(normalized, 'DTEND');

    const transactions = this.extractTransactions(normalized);

    if (transactions.length === 0) {
      throw new BadRequestException('Nenhuma transacao encontrada no arquivo OFX');
    }

    return {
      bankId,
      accountId,
      accountType,
      startDate: startDateStr ? this.parseOfxDate(startDateStr) : transactions[0].date,
      endDate: endDateStr ? this.parseOfxDate(endDateStr) : transactions[transactions.length - 1].date,
      transactions,
    };
  }

  /**
   * Normaliza OFX 1.x (SGML) para formato parseable.
   * Remove headers, normaliza quebras de linha, fecha tags abertas.
   */
  private normalizeOfx(raw: string): string {
    // Remover BOM
    let content = raw.replace(/^\uFEFF/, '');

    // Separar header SGML do corpo OFX
    const ofxStart = content.indexOf('<OFX>');
    if (ofxStart === -1) {
      throw new BadRequestException('Arquivo nao contem tag <OFX>. Formato invalido.');
    }
    content = content.substring(ofxStart);

    // Normalizar quebras de linha
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    return content;
  }

  private extractTransactions(ofx: string): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    const stmtTrnRegex = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>|<\/BANKTRANLIST>))/gi;

    let match: RegExpExecArray | null;
    while ((match = stmtTrnRegex.exec(ofx)) !== null) {
      const block = match[1];

      const fitid = this.extractTag(block, 'FITID');
      const dateStr = this.extractTag(block, 'DTPOSTED');
      const amountStr = this.extractTag(block, 'TRNAMT');
      const memo = this.extractTag(block, 'MEMO') || this.extractTag(block, 'NAME') || '';
      const type = this.extractTag(block, 'TRNTYPE') || 'OTHER';

      if (!fitid || !dateStr || !amountStr) continue;

      transactions.push({
        fitid,
        date: this.parseOfxDate(dateStr),
        amount: parseFloat(amountStr.replace(',', '.')),
        memo: memo.trim(),
        type,
      });
    }

    return transactions;
  }

  /**
   * Extrai valor de uma tag OFX/SGML.
   * Formato: <TAG>valor (sem tag de fechamento em OFX 1.x)
   */
  private extractTag(content: string, tag: string): string {
    // OFX 2.x (XML-style com fechamento)
    const xmlRegex = new RegExp(`<${tag}>([^<]+)</${tag}>`, 'i');
    const xmlMatch = content.match(xmlRegex);
    if (xmlMatch) return xmlMatch[1].trim();

    // OFX 1.x (SGML-style sem fechamento)
    const sgmlRegex = new RegExp(`<${tag}>([^\\n<]+)`, 'i');
    const sgmlMatch = content.match(sgmlRegex);
    if (sgmlMatch) return sgmlMatch[1].trim();

    return '';
  }

  /**
   * Converte data OFX (YYYYMMDDHHMMSS[.XXX:GMT]) para Date.
   */
  private parseOfxDate(dateStr: string): Date {
    // Formato: 20240115120000[-3:BRT] ou 20240115
    const cleaned = dateStr.replace(/\[.*\]/, '').trim();

    const year = parseInt(cleaned.substring(0, 4), 10);
    const month = parseInt(cleaned.substring(4, 6), 10) - 1;
    const day = parseInt(cleaned.substring(6, 8), 10);
    const hour = cleaned.length >= 10 ? parseInt(cleaned.substring(8, 10), 10) : 0;
    const min = cleaned.length >= 12 ? parseInt(cleaned.substring(10, 12), 10) : 0;

    return new Date(year, month, day, hour, min);
  }
}
