import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../tenant/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { QueueDashboardService } from './queue-dashboard.service';

@ApiTags('Filas (Admin)')
@Controller('admin/queues')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('Owner', 'Admin')
@ApiBearerAuth()
export class QueueDashboardController {
  constructor(private readonly dashboardService: QueueDashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Listar estatisticas de todas as filas' })
  getAllStats() {
    return this.dashboardService.getAllStats();
  }

  @Get(':queueName')
  @ApiOperation({ summary: 'Estatisticas de uma fila especifica' })
  async getQueueStats(@Param('queueName') queueName: string) {
    const stats = await this.dashboardService.getQueueStats(queueName);
    if (!stats) throw new NotFoundException(`Fila '${queueName}' nao encontrada`);
    return stats;
  }

  @Get(':queueName/failed')
  @ApiOperation({ summary: 'Listar jobs com falha em uma fila' })
  getFailedJobs(
    @Param('queueName') queueName: string,
    @Query('start') start?: number,
    @Query('end') end?: number,
  ) {
    return this.dashboardService.getFailedJobs(queueName, start ?? 0, end ?? 20);
  }

  @Post(':queueName/jobs/:jobId/retry')
  @ApiOperation({ summary: 'Tentar novamente um job com falha' })
  async retryJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ) {
    const retried = await this.dashboardService.retryJob(queueName, jobId);
    if (!retried) throw new NotFoundException('Fila ou job nao encontrado');
    return { message: 'Job reenfileirado com sucesso' };
  }

  @Delete(':queueName/:status')
  @ApiOperation({ summary: 'Limpar jobs concluidos ou com falha' })
  async cleanQueue(
    @Param('queueName') queueName: string,
    @Param('status') status: 'completed' | 'failed',
  ) {
    const removed = await this.dashboardService.cleanQueue(queueName, status);
    return { removed };
  }
}
