import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { AiAssistantService } from './ai-assistant.service';

@ApiTags('AI Assistant')
@Controller('companies/:companyId/assistant')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class AiAssistantController {
  constructor(private readonly assistantService: AiAssistantService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Enviar mensagem ao assistente contabil IA' })
  async chat(
    @Param('companyId') companyId: string,
    @Body() body: { messages: Array<{ role: 'user' | 'assistant'; content: string }> },
  ) {
    return this.assistantService.chat(companyId, body.messages);
  }
}
