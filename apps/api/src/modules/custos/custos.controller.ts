import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CustosService } from './custos.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { CreateCustoFixoDto } from './dto/create-custo-fixo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';

@ApiTags('Custos')
@Controller('custos')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class CustosController {
  constructor(private readonly custosService: CustosService) {}

  @Post('time-entries')
  @ApiOperation({ summary: 'Registrar apontamento de tempo' })
  createTimeEntry(@Body() dto: CreateTimeEntryDto) {
    return this.custosService.createTimeEntry(dto);
  }

  @Get('time-entries')
  @ApiOperation({ summary: 'Listar apontamentos de tempo' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'month', required: false, description: 'Formato YYYY-MM' })
  findTimeEntries(@Query('companyId') companyId?: string, @Query('month') month?: string) {
    return this.custosService.findTimeEntries(companyId, month);
  }

  @Post('fixed-costs')
  @ApiOperation({ summary: 'Cadastrar custo fixo' })
  createCustoFixo(@Body() dto: CreateCustoFixoDto) {
    return this.custosService.createCustoFixo(dto);
  }

  @Get('fixed-costs')
  @ApiOperation({ summary: 'Listar custos fixos' })
  findCustosFixos() {
    return this.custosService.findCustosFixos();
  }

  @Get('analysis/:year/:month')
  @ApiOperation({ summary: 'Analise de alocacao de custos por empresa' })
  analyze(@Param('year') year: string, @Param('month') month: string) {
    return this.custosService.analyze(Number(year), Number(month));
  }
}
