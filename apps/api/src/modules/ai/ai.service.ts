import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmResponse {
  content: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export interface LlmStructuredResponse<T> {
  data: T;
  raw: string;
  usage?: { inputTokens: number; outputTokens: number };
}

/**
 * Servico centralizado de acesso a LLMs.
 *
 * Suporta Anthropic (Claude) e OpenAI como provedores.
 * Configuracao via variaveis de ambiente:
 * - AI_PROVIDER: 'anthropic' | 'openai'
 * - AI_API_KEY: chave de API
 * - AI_MODEL: modelo a usar (default: claude-sonnet-4-20250514)
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly provider: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.provider = this.config.get<string>('AI_PROVIDER') || 'anthropic';
    this.apiKey = this.config.get<string>('AI_API_KEY') || '';
    this.model = this.config.get<string>('AI_MODEL') || 'claude-sonnet-4-20250514';

    if (!this.apiKey) {
      this.logger.warn('AI_API_KEY nao configurada — funcionalidades de IA desabilitadas');
    }
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Envia mensagens para o LLM e retorna a resposta.
   */
  async chat(messages: LlmMessage[], options?: {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }): Promise<LlmResponse> {
    if (!this.apiKey) {
      throw new Error('AI_API_KEY nao configurada');
    }

    if (this.provider === 'anthropic') {
      return this.chatAnthropic(messages, options);
    }
    return this.chatOpenAI(messages, options);
  }

  /**
   * Envia mensagens e espera resposta em formato JSON estruturado.
   */
  async chatStructured<T>(
    messages: LlmMessage[],
    options?: {
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    },
  ): Promise<LlmStructuredResponse<T>> {
    const enrichedMessages = [...messages];
    const lastMsg = enrichedMessages[enrichedMessages.length - 1];
    if (lastMsg.role === 'user') {
      lastMsg.content += '\n\nResponda APENAS com JSON valido, sem markdown ou texto adicional.';
    }

    const response = await this.chat(enrichedMessages, options);

    // Extrair JSON da resposta
    const jsonMatch = response.content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('LLM nao retornou JSON valido');
    }

    const data = JSON.parse(jsonMatch[0]) as T;
    return { data, raw: response.content, usage: response.usage };
  }

  private async chatAnthropic(
    messages: LlmMessage[],
    options?: { maxTokens?: number; temperature?: number; systemPrompt?: string },
  ): Promise<LlmResponse> {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: this.apiKey });

    const systemMessages = messages.filter((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const response = await client.messages.create({
      model: this.model,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.3,
      system: options?.systemPrompt || systemMessages.map((m) => m.content).join('\n'),
      messages: nonSystemMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textContent = response.content.find((c) => c.type === 'text');
    return {
      content: textContent?.text || '',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  private async chatOpenAI(
    messages: LlmMessage[],
    options?: { maxTokens?: number; temperature?: number; systemPrompt?: string },
  ): Promise<LlmResponse> {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: this.apiKey });

    const allMessages = options?.systemPrompt
      ? [{ role: 'system' as const, content: options.systemPrompt }, ...messages]
      : messages;

    const response = await client.chat.completions.create({
      model: this.model,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.3,
      messages: allMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
    };
  }
}
