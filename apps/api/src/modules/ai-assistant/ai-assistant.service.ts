import { Injectable, Logger } from '@nestjs/common';
import { AiService, LlmMessage } from '../ai/ai.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { ObligationsService } from '../obligations/obligations.service';
import { requireCurrentTenant } from '../tenant/tenant.context';

interface AssistantTool {
  name: string;
  description: string;
  handler: (params: any) => Promise<any>;
}

/**
 * Assistente contabil com IA.
 *
 * Funcionalidades:
 * - Responde perguntas sobre contabilidade brasileira
 * - Consulta dados do sistema via function-calling
 * - Gera relatorios sob demanda
 * - Sugere classificacoes e tratamentos contabeis
 *
 * O assistente tem acesso somente aos dados do tenant/empresa do usuario.
 */
@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly tools: AssistantTool[];

  constructor(
    private readonly aiService: AiService,
    private readonly dashboardService: DashboardService,
    private readonly obligationsService: ObligationsService,
  ) {
    this.tools = [
      {
        name: 'getDashboardSummary',
        description: 'Obtem resumo do dashboard (empresas ativas, lancamentos, funcionarios, guias pendentes)',
        handler: async (params: { companyId: string }) => {
          return this.dashboardService.getSummary(params.companyId);
        },
      },
      {
        name: 'getPendingObligations',
        description: 'Lista obrigacoes acessorias pendentes (SPED, DCTF, etc.)',
        handler: async (params: { companyId: string }) => {
          return this.obligationsService.findPending(params.companyId);
        },
      },
    ];
  }

  async chat(
    companyId: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<{ response: string; toolsUsed?: string[] }> {
    if (!this.aiService.isConfigured) {
      return {
        response: 'O assistente IA nao esta configurado. Configure a variavel AI_API_KEY para habilitar.',
      };
    }

    const ctx = requireCurrentTenant();
    const toolsUsed: string[] = [];

    const systemPrompt = `Voce e o assistente contabil do Contabilita, um sistema de contabilidade brasileiro.
Voce ajuda contadores e empresarios com questoes fiscais, contabeis e trabalhistas.

Contexto:
- Tenant: ${ctx.tenantId}
- Empresa: ${companyId}
- Data atual: ${new Date().toLocaleDateString('pt-BR')}

Voce tem acesso a estas ferramentas (use quando necessario):
${this.tools.map((t) => `- ${t.name}: ${t.description}`).join('\n')}

Para usar uma ferramenta, inclua na sua resposta:
[TOOL_CALL:nomeDaFerramenta:{"param":"valor"}]

Regras:
- Responda sempre em portugues
- Seja preciso em questoes fiscais — cite legislacao quando relevante
- Se nao souber a resposta, diga que nao sabe
- Formate valores monetarios em R$ e datas em DD/MM/AAAA
- Use markdown para formatacao`;

    const llmMessages: LlmMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let response = await this.aiService.chat(llmMessages, {
      systemPrompt,
      maxTokens: 2048,
      temperature: 0.5,
    });

    // Processar chamadas de ferramentas (ate 3 iteracoes)
    let iterations = 0;
    while (response.content.includes('[TOOL_CALL:') && iterations < 3) {
      const toolCalls = this.extractToolCalls(response.content);
      const toolResults: string[] = [];

      for (const call of toolCalls) {
        const tool = this.tools.find((t) => t.name === call.name);
        if (tool) {
          try {
            const result = await tool.handler({ companyId, ...call.params });
            toolResults.push(`Resultado ${call.name}: ${JSON.stringify(result)}`);
            toolsUsed.push(call.name);
          } catch (err) {
            toolResults.push(`Erro ${call.name}: ${err.message}`);
          }
        }
      }

      llmMessages.push(
        { role: 'assistant', content: response.content },
        { role: 'user', content: `Resultados das ferramentas:\n${toolResults.join('\n')}\n\nContinue sua resposta ao usuario usando estes dados.` },
      );

      response = await this.aiService.chat(llmMessages, {
        systemPrompt,
        maxTokens: 2048,
        temperature: 0.5,
      });

      iterations++;
    }

    const cleanResponse = response.content
      .replace(/\[TOOL_CALL:[^\]]+\]/g, '')
      .trim();

    return { response: cleanResponse, toolsUsed };
  }

  private extractToolCalls(
    content: string,
  ): Array<{ name: string; params: any }> {
    const pattern = /\[TOOL_CALL:(\w+):(\{[^}]*\})\]/g;
    const calls: Array<{ name: string; params: any }> = [];
    let match;

    while ((match = pattern.exec(content)) !== null) {
      try {
        calls.push({ name: match[1], params: JSON.parse(match[2]) });
      } catch {
        calls.push({ name: match[1], params: {} });
      }
    }

    return calls;
  }
}
