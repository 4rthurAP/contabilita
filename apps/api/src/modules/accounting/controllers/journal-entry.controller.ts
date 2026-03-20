import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JournalEntryService } from '../services/journal-entry.service';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../tenant/guards/tenant.guard';

@ApiTags('Lancamentos Contabeis')
@Controller('companies/:companyId/journal-entries')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class JournalEntryController {
  constructor(private readonly journalEntryService: JournalEntryService) {}

  @Post()
  @ApiOperation({ summary: 'Criar lancamento contabil (partida dobrada)' })
  create(@Param('companyId') companyId: string, @Body() dto: CreateJournalEntryDto) {
    return this.journalEntryService.create(companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar lancamentos contabeis' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(
    @Param('companyId') companyId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.journalEntryService.findAll(companyId, page || 1, limit || 20, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter lancamento por ID' })
  findOne(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.journalEntryService.findById(companyId, id);
  }

  @Get('reports/ledger/:accountId')
  @ApiOperation({ summary: 'Razao (General Ledger) de uma conta' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  getLedger(
    @Param('companyId') companyId: string,
    @Param('accountId') accountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.journalEntryService.getLedger(companyId, accountId, startDate, endDate);
  }

  @Get('reports/trial-balance')
  @ApiOperation({ summary: 'Balancete de Verificacao (Trial Balance)' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  getTrialBalance(
    @Param('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.journalEntryService.getTrialBalance(companyId, startDate, endDate);
  }
}
