import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../../ai/ai.service';
import Decimal from 'decimal.js';

export interface ReconciliationCandidate {
  transactionId: string;
  memo: string;
  amount: string;
  date: Date;
  counterpartDocument?: string;
}

export interface ReconciliationTarget {
  id: string;
  type: 'invoice' | 'journal_entry';
  description: string;
  amount: string;
  date: Date;
  cnpj?: string;
}

export interface AiReconciliationMatch {
  transactionId: string;
  targetId: string;
  targetType: 'invoice' | 'journal_entry';
  confidence: number;
  method: string;
  reasoning: string;
}

/**
 * Servico de conciliacao bancaria assistida por IA.
 *
 * Complementa o matching baseado em regras (Phase 1.2) com:
 * 1. Analise semantica de memos bancarios via LLM
 * 2. Matching fuzzy de nomes de empresas
 * 3. Deteccao de pagamentos parciais e agrupados
 * 4. Sugestao de conta contabil para transacoes sem match
 *
 * Scoring multi-fator:
 * - Valor exato: 40%
 * - Similaridade de texto (memo vs descricao): 30%
 * - Proximidade de data: 20%
 * - Padrao historico: 10%
 */
@Injectable()
export class ReconciliationAiService {
  private readonly logger = new Logger(ReconciliationAiService.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * Analisa transacoes bancarias em lote e sugere matches.
   * Usa LLM para interpretar memos e encontrar correspondencias.
   */
  async suggestMatches(
    transactions: ReconciliationCandidate[],
    targets: ReconciliationTarget[],
  ): Promise<AiReconciliationMatch[]> {
    if (!this.aiService.isConfigured || transactions.length === 0 || targets.length === 0) {
      return [];
    }

    // Processar em lotes de 20 transacoes por vez
    const batchSize = 20;
    const allMatches: AiReconciliationMatch[] = [];

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const matches = await this.matchBatch(batch, targets);
      allMatches.push(...matches);
    }

    return allMatches;
  }

  private async matchBatch(
    transactions: ReconciliationCandidate[],
    targets: ReconciliationTarget[],
  ): Promise<AiReconciliationMatch[]> {
    const systemPrompt = `Voce e um contador brasileiro especialista em conciliacao bancaria.

Analise as transacoes bancarias e encontre correspondencias nas notas fiscais/lancamentos.

Considere:
- Memos bancarios frequentemente abreviam nomes de empresas
- PIX e TED podem usar razao social ou nome fantasia
- Pagamentos podem ter valores ligeiramente diferentes (juros, multa, desconto)
- Um pagamento pode cobrir multiplas notas (pagamento agrupado)
- Uma nota pode ser paga em multiplas parcelas (pagamento parcial)

Para cada transacao, encontre a melhor correspondencia e atribua:
- confidence: 0.0 a 1.0
- method: 'semantic_match' | 'fuzzy_name' | 'partial_payment' | 'grouped_payment' | 'no_match'
- reasoning: explicacao breve

Retorne JSON:
{
  "matches": [
    {
      "transactionId": "id da transacao",
      "targetId": "id da NF ou lancamento, ou null se nenhum",
      "targetType": "invoice ou journal_entry",
      "confidence": 0.0 a 1.0,
      "method": "metodo",
      "reasoning": "explicacao"
    }
  ]
}`;

    const userContent = `Transacoes bancarias:\n${JSON.stringify(
      transactions.map((t) => ({
        id: t.transactionId,
        memo: t.memo,
        valor: t.amount,
        data: t.date,
        cnpj: t.counterpartDocument,
      })),
      null,
      2,
    )}\n\nNotas fiscais e lancamentos disponiveis:\n${JSON.stringify(
      targets.map((t) => ({
        id: t.id,
        tipo: t.type,
        descricao: t.description,
        valor: t.amount,
        data: t.date,
        cnpj: t.cnpj,
      })),
      null,
      2,
    )}`;

    try {
      const response = await this.aiService.chatStructured<{
        matches: Array<{
          transactionId: string;
          targetId: string | null;
          targetType: string;
          confidence: number;
          method: string;
          reasoning: string;
        }>;
      }>(
        [{ role: 'user', content: userContent }],
        { systemPrompt, maxTokens: 4096, temperature: 0.1 },
      );

      return response.data.matches
        .filter((m) => m.targetId && m.confidence >= 0.5)
        .map((m) => ({
          transactionId: m.transactionId,
          targetId: m.targetId!,
          targetType: m.targetType as 'invoice' | 'journal_entry',
          confidence: m.confidence,
          method: m.method,
          reasoning: m.reasoning,
        }));
    } catch (error) {
      this.logger.error(`Erro na conciliacao IA: ${error}`);
      return [];
    }
  }

  /**
   * Calcula score multi-fator para um par transacao-alvo.
   */
  calculateMultiFactorScore(
    transaction: ReconciliationCandidate,
    target: ReconciliationTarget,
    aiConfidence: number,
  ): number {
    const txAmount = new Decimal(transaction.amount).abs();
    const tgtAmount = new Decimal(target.amount).abs();

    // Fator 1: Valor (40%)
    const amountDiff = txAmount.minus(tgtAmount).abs();
    const amountScore = amountDiff.lte(new Decimal('0.01'))
      ? 1.0
      : amountDiff.lte(txAmount.times('0.05'))
        ? 0.7
        : 0.0;

    // Fator 2: Similaridade semantica via IA (30%)
    const semanticScore = aiConfidence;

    // Fator 3: Proximidade de data (20%)
    const daysDiff = Math.abs(
      (transaction.date.getTime() - target.date.getTime()) / (24 * 3600 * 1000),
    );
    const dateScore = daysDiff <= 1 ? 1.0 : daysDiff <= 3 ? 0.8 : daysDiff <= 7 ? 0.5 : 0.2;

    // Fator 4: CNPJ match (10%)
    const cnpjScore =
      transaction.counterpartDocument && target.cnpj
        ? transaction.counterpartDocument === target.cnpj
          ? 1.0
          : 0.0
        : 0.3; // Neutro quando nao disponivel

    return amountScore * 0.4 + semanticScore * 0.3 + dateScore * 0.2 + cnpjScore * 0.1;
  }
}
