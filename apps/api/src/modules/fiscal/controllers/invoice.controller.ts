import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InvoiceService } from '../services/invoice.service';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { ImportXmlDto } from '../dto/import-xml.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../tenant/guards/tenant.guard';
import { RolesGuard } from '../../tenant/guards/roles.guard';
import { AbilitiesGuard } from '../../../common/guards/abilities.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CheckAbilities } from '../../../common/decorators/check-abilities.decorator';
import { TenantRole } from '@contabilita/shared';

@ApiTags('Notas Fiscais')
@Controller('companies/:companyId/invoices')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, AbilitiesGuard)
@ApiBearerAuth()
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['create', 'FiscalInvoice'])
  @ApiOperation({ summary: 'Criar nota fiscal com calculo automatico de impostos' })
  create(@Param('companyId') companyId: string, @Body() dto: CreateInvoiceDto) {
    return this.invoiceService.create(companyId, dto);
  }

  @Post('import-xml')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['create', 'FiscalInvoice'])
  @ApiOperation({ summary: 'Importar NF-e a partir de XML' })
  importXml(@Param('companyId') companyId: string, @Body() dto: ImportXmlDto) {
    return this.invoiceService.importXml(companyId, dto.xml);
  }

  @Patch(':id/post')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['update', 'FiscalInvoice'])
  @ApiOperation({ summary: 'Escriturar nota fiscal (emite evento para contabilidade)' })
  post(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.invoiceService.post(companyId, id);
  }

  @Patch(':id/cancel')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @CheckAbilities(['update', 'FiscalInvoice'])
  @ApiOperation({ summary: 'Cancelar nota fiscal' })
  cancel(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.invoiceService.cancel(companyId, id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar notas fiscais' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'tipo', required: false })
  findAll(
    @Param('companyId') companyId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('tipo') tipo?: string,
  ) {
    return this.invoiceService.findAll(companyId, page || 1, limit || 20, tipo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter nota fiscal por ID' })
  findOne(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.invoiceService.findById(companyId, id);
  }
}
