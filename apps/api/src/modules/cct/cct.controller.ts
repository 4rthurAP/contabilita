import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CctService } from './cct.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';

@ApiTags('CCT - Conteudo Contabil Tributario')
@Controller('cct')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class CctController {
  constructor(private readonly cctService: CctService) {}

  @Get('compare-regimes')
  @ApiOperation({ summary: 'Comparar carga tributaria entre regimes' })
  @ApiQuery({ name: 'revenue', required: true, type: Number })
  @ApiQuery({ name: 'expenses', required: true, type: Number })
  compareRegimes(@Query('revenue') revenue: string, @Query('expenses') expenses: string) {
    return this.cctService.compareRegimes(Number(revenue), Number(expenses));
  }

  @Get('simples-rates/:cnae/:revenue')
  @ApiOperation({ summary: 'Obter aliquotas do Simples Nacional por CNAE' })
  getSimplesRates(@Param('cnae') cnae: string, @Param('revenue') revenue: string) {
    return this.cctService.getSimplesRates(cnae, Number(revenue));
  }

  @Get('pis-cofins/:ncm')
  @ApiOperation({ summary: 'Obter aliquotas PIS/COFINS por NCM' })
  getPisCofinsRates(@Param('ncm') ncm: string) {
    return this.cctService.getPisCofinsRates(ncm);
  }
}
