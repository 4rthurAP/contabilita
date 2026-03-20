import { Controller, Get, Patch, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';

@ApiTags('Notificacoes')
@Controller('notifications')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notifService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificacoes do usuario' })
  @ApiQuery({ name: 'unread', required: false })
  findAll(@Req() req: any, @Query('unread') unread?: string) {
    return this.notifService.getForUser(req.user.id, unread === 'true');
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar notificacao como lida' })
  markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.notifService.markAsRead(req.user.id, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todas como lidas' })
  markAllAsRead(@Req() req: any) {
    return this.notifService.markAllAsRead(req.user.id);
  }
}
