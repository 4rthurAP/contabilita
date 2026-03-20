import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountService } from '../services/account.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../tenant/guards/tenant.guard';

@ApiTags('Plano de Contas')
@Controller('companies/:companyId/accounts')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  @ApiOperation({ summary: 'Criar conta no plano de contas' })
  create(@Param('companyId') companyId: string, @Body() dto: CreateAccountDto) {
    return this.accountService.create(companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar plano de contas (flat)' })
  findAll(@Param('companyId') companyId: string) {
    return this.accountService.findAll(companyId);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Plano de contas em formato arvore' })
  findTree(@Param('companyId') companyId: string) {
    return this.accountService.findTree(companyId);
  }

  @Get('analytical')
  @ApiOperation({ summary: 'Listar apenas contas analiticas (para lancamentos)' })
  findAnalytical(@Param('companyId') companyId: string) {
    return this.accountService.findAnalytical(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter conta por ID' })
  findOne(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.accountService.findById(companyId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar conta' })
  update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountService.update(companyId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover conta (soft delete)' })
  remove(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.accountService.remove(companyId, id);
  }
}
