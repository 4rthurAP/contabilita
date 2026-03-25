import { Controller, Get, Query, UseGuards, Res, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { requireCurrentTenant } from '../tenant/tenant.context';

@ApiTags('Storage')
@Controller('storage')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('presigned-url')
  @ApiOperation({ summary: 'Obter URL pre-assinada para download de arquivo' })
  async getPresignedUrl(@Query('key') key: string) {
    if (!key) throw new BadRequestException('Parametro key e obrigatorio');

    const ctx = requireCurrentTenant();
    if (!key.startsWith(ctx.tenantId + '/')) {
      throw new ForbiddenException('Acesso negado a este arquivo');
    }

    const url = await this.storageService.getPresignedUrl(key);
    return { url };
  }

  @Get('download')
  @ApiOperation({ summary: 'Download de arquivo (backend local)' })
  async download(@Query('key') key: string, @Res() res: Response) {
    if (!key) throw new BadRequestException('Parametro key e obrigatorio');

    const ctx = requireCurrentTenant();
    if (!key.startsWith(ctx.tenantId + '/')) {
      throw new ForbiddenException('Acesso negado a este arquivo');
    }

    const buffer = await this.storageService.download(key);
    const fileName = key.split('/').pop() || 'file';
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }
}
