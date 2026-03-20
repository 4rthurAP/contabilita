import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BuscaNfeService } from './busca-nfe.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';

@ApiTags('Busca NF-e')
@Controller('companies/:companyId/busca-nfe')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class BuscaNfeController {
  constructor(private readonly buscaNfeService: BuscaNfeService) {}

  @Post('fetch')
  @ApiOperation({ summary: 'Buscar NF-e na SEFAZ (Distribuicao DFe)' })
  fetch(@Param('companyId') companyId: string) {
    return this.buscaNfeService.fetch(companyId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historico de consultas de NF-e' })
  getHistory(@Param('companyId') companyId: string) {
    return this.buscaNfeService.getHistory(companyId);
  }
}
