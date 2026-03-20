import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LalurService } from './lalur.service';
import { CreateLalurEntryDto, CreateLalurBalanceDto } from './dto/create-lalur-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';

@ApiTags('LALUR')
@Controller('companies/:companyId/lalur')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class LalurController {
  constructor(private readonly lalurService: LalurService) {}

  @Post('entries')
  @ApiOperation({ summary: 'Criar registro Parte A (adicao/exclusao)' })
  createEntry(@Param('companyId') companyId: string, @Body() dto: CreateLalurEntryDto) {
    return this.lalurService.createEntry(companyId, dto);
  }

  @Get('entries/:year')
  @ApiOperation({ summary: 'Listar registros Parte A por ano' })
  @ApiQuery({ name: 'quarter', required: false })
  getEntries(@Param('companyId') companyId: string, @Param('year') year: number, @Query('quarter') quarter?: number) {
    return this.lalurService.getEntries(companyId, year, quarter);
  }

  @Get('calculate/:year/:quarter')
  @ApiOperation({ summary: 'Calcular Lucro Real do periodo' })
  @ApiQuery({ name: 'lucroContabil', required: true })
  calculate(
    @Param('companyId') companyId: string,
    @Param('year') year: number,
    @Param('quarter') quarter: number,
    @Query('lucroContabil') lucroContabil: string,
  ) {
    return this.lalurService.calculateLucroReal(companyId, year, quarter, lucroContabil);
  }

  @Post('balances')
  @ApiOperation({ summary: 'Criar saldo Parte B' })
  createBalance(@Param('companyId') companyId: string, @Body() dto: CreateLalurBalanceDto) {
    return this.lalurService.createBalance(companyId, dto);
  }

  @Get('balances/:year')
  @ApiOperation({ summary: 'Listar saldos Parte B' })
  getBalances(@Param('companyId') companyId: string, @Param('year') year: number) {
    return this.lalurService.getBalances(companyId, year);
  }
}
