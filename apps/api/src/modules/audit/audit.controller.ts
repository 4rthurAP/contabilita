import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../tenant/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantRole } from '@contabilita/shared';

@ApiTags('Auditoria')
@Controller('audit')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(TenantRole.Owner, TenantRole.Admin)
  @ApiOperation({ summary: 'Listar logs de auditoria' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'resource', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('resource') resource?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.findAll(undefined, page || 1, limit || 50, {
      resource,
      action,
      startDate,
      endDate,
    });
  }

  @Get('resource/:resource/:resourceId')
  @Roles(TenantRole.Owner, TenantRole.Admin)
  @ApiOperation({ summary: 'Timeline de auditoria de um recurso' })
  getTimeline(@Param('resource') resource: string, @Param('resourceId') resourceId: string) {
    return this.auditService.getResourceTimeline(resource, resourceId);
  }
}
