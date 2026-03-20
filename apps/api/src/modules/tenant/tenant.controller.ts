import { Controller, Post, Get, Body, UseGuards, Req, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo escritorio contabil' })
  create(@Body() dto: CreateTenantDto, @Req() req: any) {
    return this.tenantService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar escritorios do usuario' })
  findMyTenants(@Req() req: any) {
    return this.tenantService.findUserTenants(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter escritorio por ID' })
  findOne(@Param('id') id: string) {
    return this.tenantService.findById(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Listar membros do escritorio' })
  getMembers(@Param('id') id: string) {
    return this.tenantService.getMembers(id);
  }
}
