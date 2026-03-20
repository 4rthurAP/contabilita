import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../tenant/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantRole } from '@contabilita/shared';

@ApiTags('Companies')
@Controller('companies')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @ApiOperation({ summary: 'Cadastrar nova empresa' })
  create(@Body() dto: CreateCompanyDto) {
    return this.companyService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar empresas do escritorio' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.companyService.findAll(page || 1, limit || 20, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter empresa por ID' })
  findOne(@Param('id') id: string) {
    return this.companyService.findById(id);
  }

  @Put(':id')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
  @ApiOperation({ summary: 'Atualizar empresa' })
  update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companyService.update(id, dto);
  }

  @Delete(':id')
  @Roles(TenantRole.Owner, TenantRole.Admin)
  @ApiOperation({ summary: 'Remover empresa (soft delete)' })
  remove(@Param('id') id: string) {
    return this.companyService.remove(id);
  }
}
