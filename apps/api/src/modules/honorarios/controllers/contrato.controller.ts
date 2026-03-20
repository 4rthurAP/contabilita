import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContratoService } from '../services/contrato.service';
import { CreateContratoDto } from '../dto/create-contrato.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../tenant/guards/tenant.guard';

@ApiTags('Honorarios - Contratos')
@Controller('companies/:companyId/contratos')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class ContratoController {
  constructor(private readonly contratoService: ContratoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar contrato de honorarios' })
  create(@Param('companyId') companyId: string, @Body() dto: CreateContratoDto) {
    return this.contratoService.create(companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar contratos' })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Param('companyId') companyId: string, @Query('status') status?: string) {
    return this.contratoService.findAll(companyId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter contrato por ID' })
  findOne(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.contratoService.findOne(companyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar contrato' })
  update(@Param('companyId') companyId: string, @Param('id') id: string, @Body() dto: Partial<CreateContratoDto>) {
    return this.contratoService.update(companyId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancelar contrato' })
  remove(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.contratoService.remove(companyId, id);
  }

  @Post('generate/:year/:month')
  @ApiOperation({ summary: 'Gerar cobrancas mensais para contratos ativos' })
  generate(
    @Param('companyId') companyId: string,
    @Param('year') year: number,
    @Param('month') month: number,
  ) {
    return this.contratoService.gerarCobrancasMensais(companyId, year, month);
  }
}
