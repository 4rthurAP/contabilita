import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiService } from '../../ai/ai.service';
import { Invoice, InvoiceDocument } from '../schemas/invoice.schema';
import { requireCurrentTenant } from '../../tenant/tenant.context';

export interface ClassificationSuggestion {
  cfop: string;
  ncm: string;
  cst: string;
  confidence: number;
  reasoning: string;
}

export interface ItemClassification {
  itemIndex: number;
  descricao: string;
  suggestion: ClassificationSuggestion;
  alternatives?: ClassificationSuggestion[];
}

/**
 * Servico de classificacao fiscal inteligente usando IA.
 *
 * Fluxo:
 * 1. Coleta historico de classificacoes anteriores da empresa (few-shot examples)
 * 2. Monta prompt com contexto fiscal (regime tributario, UF, tipo operacao)
 * 3. LLM sugere CFOP, NCM e CST com nivel de confianca
 * 4. Se confianca >= 0.85, aplica automaticamente; senao, sugere ao usuario
 *
 * Aprendizado: cada correcao do contador enriquece o historico para few-shot.
 */
@Injectable()
export class ClassificationService {
  private readonly logger = new Logger(ClassificationService.name);

  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    private readonly aiService: AiService,
  ) {}

  /**
   * Classifica itens de uma nota fiscal com sugestoes de CFOP/NCM/CST.
   */
  async classifyItems(
    companyId: string,
    items: Array<{ descricao: string; ncm?: string; cfop?: string }>,
    context: {
      tipoOperacao: 'entrada' | 'saida';
      ufOrigem: string;
      ufDestino: string;
      regimeTributario: string;
      fornecedorCnpj?: string;
    },
  ): Promise<ItemClassification[]> {
    if (!this.aiService.isConfigured) {
      this.logger.warn('AI nao configurada — classificacao manual necessaria');
      return [];
    }

    const ctx = requireCurrentTenant();

    // 1. Coletar historico de classificacoes (few-shot learning)
    const history = await this.getClassificationHistory(
      ctx.tenantId,
      companyId,
      context.fornecedorCnpj,
    );

    // 2. Montar prompt com contexto
    const systemPrompt = this.buildSystemPrompt(context, history);

    // 3. Enviar para LLM
    const userContent = `Classifique os seguintes itens:\n${JSON.stringify(items.map((item, i) => ({
      index: i,
      descricao: item.descricao,
      ncmAtual: item.ncm || 'nao informado',
      cfopAtual: item.cfop || 'nao informado',
    })), null, 2)}`;

    try {
      const response = await this.aiService.chatStructured<{
        classifications: Array<{
          itemIndex: number;
          cfop: string;
          ncm: string;
          cst: string;
          confidence: number;
          reasoning: string;
          alternatives?: Array<{ cfop: string; ncm: string; cst: string; confidence: number; reasoning: string }>;
        }>;
      }>(
        [{ role: 'user', content: userContent }],
        { systemPrompt, maxTokens: 4096, temperature: 0.1 },
      );

      return response.data.classifications.map((c) => ({
        itemIndex: c.itemIndex,
        descricao: items[c.itemIndex]?.descricao || '',
        suggestion: {
          cfop: c.cfop,
          ncm: c.ncm,
          cst: c.cst,
          confidence: c.confidence,
          reasoning: c.reasoning,
        },
        alternatives: c.alternatives?.map((a) => ({
          cfop: a.cfop,
          ncm: a.ncm,
          cst: a.cst,
          confidence: a.confidence,
          reasoning: a.reasoning,
        })),
      }));
    } catch (error) {
      this.logger.error(`Erro na classificacao IA: ${error}`);
      return [];
    }
  }

  /**
   * Busca historico de classificacoes bem-sucedidas para few-shot learning.
   */
  private async getClassificationHistory(
    tenantId: string,
    companyId: string,
    fornecedorCnpj?: string,
  ): Promise<Array<{ descricao: string; cfop: string; ncm: string }>> {
    // Priorizar NFs do mesmo fornecedor
    const filter: any = {
      tenantId,
      companyId,
      status: 'escriturada',
      'items.cfop': { $exists: true },
    };
    if (fornecedorCnpj) {
      filter.fornecedorClienteCnpj = fornecedorCnpj;
    }

    const invoices = await this.invoiceModel
      .find(filter)
      .sort({ dataEmissao: -1 })
      .limit(20)
      .select('items');

    const examples: Array<{ descricao: string; cfop: string; ncm: string }> = [];
    for (const inv of invoices) {
      for (const item of inv.items || []) {
        if (item.cfop && item.ncm && examples.length < 30) {
          examples.push({
            descricao: item.descricao,
            cfop: item.cfop,
            ncm: item.ncm,
          });
        }
      }
    }

    return examples;
  }

  private buildSystemPrompt(
    context: {
      tipoOperacao: string;
      ufOrigem: string;
      ufDestino: string;
      regimeTributario: string;
    },
    history: Array<{ descricao: string; cfop: string; ncm: string }>,
  ): string {
    const historyText = history.length > 0
      ? `\nExemplos de classificacoes anteriores desta empresa:\n${history.map(
          (h) => `- "${h.descricao}" → CFOP: ${h.cfop}, NCM: ${h.ncm}`,
        ).join('\n')}`
      : '';

    return `Voce e um especialista fiscal brasileiro. Classifique itens de nota fiscal com CFOP, NCM e CST.

Contexto da operacao:
- Tipo: ${context.tipoOperacao}
- UF Origem: ${context.ufOrigem}
- UF Destino: ${context.ufDestino}
- Regime Tributario: ${context.regimeTributario}
- Operacao ${context.ufOrigem === context.ufDestino ? 'interna' : 'interestadual'}
${historyText}

Regras CFOP:
- Operacoes internas de entrada: serie 1.xxx
- Operacoes interestaduais de entrada: serie 2.xxx
- Operacoes internas de saida: serie 5.xxx
- Operacoes interestaduais de saida: serie 6.xxx
- Exportacao: serie 7.xxx

Retorne JSON com:
{
  "classifications": [
    {
      "itemIndex": 0,
      "cfop": "CFOP sugerido",
      "ncm": "NCM 8 digitos",
      "cst": "CST ICMS (00, 10, 20, etc)",
      "confidence": 0.0 a 1.0,
      "reasoning": "justificativa breve",
      "alternatives": [{"cfop": "...", "ncm": "...", "cst": "...", "confidence": 0.0, "reasoning": "..."}]
    }
  ]
}`;
  }
}
