import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ObligationsService } from './obligations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../tenant/guards/roles.guard';
import { AbilitiesGuard } from '../../common/guards/abilities.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CheckAbilities } from '../../common/decorators/check-abilities.decorator';
import { TenantRole } from '@contabilita/shared';

@ApiTags('Obrigacoes Acessorias')
@Controller('companies/:companyId/obligations')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, AbilitiesGuard)
@ApiBearerAuth()
export class ObligationsController {
  constructor(private readonly obligationsService: ObligationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar obrigacoes acessorias' })
  @ApiQuery({ name: 'year', required: false })
  findAll(@Param('companyId') companyId: string, @Query('year') year?: number) {
    return this.obligationsService.findAll(companyId, year);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Listar obrigacoes pendentes' })
  findPending(@Param('companyId') companyId: string) {
    return this.obligationsService.findPending(companyId);
  }

  @Post('generate-monthly/:year/:month')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['create', 'Obligation'])
  @ApiOperation({ summary: 'Gerar obrigacoes mensais (EFD, DCTF, etc.)' })
  generateMonthly(
    @Param('companyId') companyId: string,
    @Param('year') year: number,
    @Param('month') month: number,
  ) {
    return this.obligationsService.generateMonthlyObligations(companyId, year, month);
  }

  @Post('generate-annual/:year')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['create', 'Obligation'])
  @ApiOperation({ summary: 'Gerar obrigacoes anuais (ECD, DIRF, etc.)' })
  generateAnnual(@Param('companyId') companyId: string, @Param('year') year: number) {
    return this.obligationsService.generateAnnualObligations(companyId, year);
  }

  @Post('sped-ecd/:year')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['create', 'Obligation'])
  @ApiOperation({ summary: 'Gerar arquivo SPED Contabil (ECD)' })
  generateEcd(@Param('companyId') companyId: string, @Param('year') year: number) {
    return this.obligationsService.generateEcd(companyId, year);
  }

  @Post('sped-efd/:year/:month')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['create', 'Obligation'])
  @ApiOperation({ summary: 'Gerar arquivo SPED Fiscal (EFD)' })
  generateEfd(
    @Param('companyId') companyId: string,
    @Param('year') year: number,
    @Param('month') month: number,
  ) {
    return this.obligationsService.generateEfd(companyId, year, month);
  }

  @Post('sped-reinf/:year/:month')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['create', 'Obligation'])
  @ApiOperation({ summary: 'Gerar eventos EFD-Reinf' })
  generateReinf(
    @Param('companyId') companyId: string,
    @Param('year') year: number,
    @Param('month') month: number,
  ) {
    return this.obligationsService.generateReinf(companyId, year, month);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download do arquivo gerado' })
  async download(@Param('companyId') companyId: string, @Param('id') id: string, @Res() res: Response) {
    const { fileName, content } = await this.obligationsService.downloadFile(companyId, id);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(content);
  }

  @Post(':id/transmit')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['update', 'Obligation'])
  @ApiOperation({ summary: 'Enfileirar transmissao SPED via certificado A1' })
  enqueueTransmission(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.obligationsService.enqueueTransmission(companyId, id);
  }

  @Patch(':id/mark-transmitted')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['update', 'Obligation'])
  @ApiOperation({ summary: 'Marcar obrigacao como transmitida manualmente' })
  markTransmitted(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body('recibo') recibo: string,
  ) {
    return this.obligationsService.markTransmitted(companyId, id, recibo);
  }
}
