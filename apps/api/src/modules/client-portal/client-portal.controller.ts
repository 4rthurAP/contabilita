import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../tenant/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantRole } from '@contabilita/shared';
import { ClientPortalService } from './client-portal.service';

/**
 * Portal do cliente — acesso restrito (Viewer) para consulta de
 * guias, obrigacoes e folha de pagamento.
 */
@ApiTags('Portal do Cliente')
@Controller('companies/:companyId/portal')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class ClientPortalController {
  constructor(private readonly clientPortalService: ClientPortalService) {}

  @Get('summary')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant, TenantRole.Analyst, TenantRole.Viewer)
  @ApiOperation({ summary: 'Resumo do portal do cliente' })
  async getSummary(@Param('companyId') companyId: string) {
    return this.clientPortalService.getSummary(companyId);
  }

  @Get('payments')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant, TenantRole.Analyst, TenantRole.Viewer)
  @ApiOperation({ summary: 'Listar guias de pagamento (portal)' })
  @ApiQuery({ name: 'status', required: false })
  async getPayments(@Param('companyId') companyId: string, @Query('status') status?: string) {
    return this.clientPortalService.getPayments(companyId, status);
  }

  @Get('obligations')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant, TenantRole.Analyst, TenantRole.Viewer)
  @ApiOperation({ summary: 'Listar obrigacoes (portal)' })
  async getObligations(@Param('companyId') companyId: string) {
    return this.clientPortalService.getObligations(companyId);
  }
}
