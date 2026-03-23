import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model } from 'mongoose';
import { Queue } from 'bullmq';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { UploadedDocument, DocumentDocument, DocumentStatus } from './schemas/document.schema';
import { StorageService } from '../storage/storage.service';
import { requireCurrentTenant } from '../tenant/tenant.context';
import { QUEUE_NAMES } from '../queue/queue.constants';
import type { OcrJobData } from './processors/ocr-processing.processor';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

@ApiTags('Document Intelligence')
@Controller('companies/:companyId/documents')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class DocumentIntelligenceController {
  constructor(
    @InjectModel(UploadedDocument.name) private docModel: Model<DocumentDocument>,
    private readonly storageService: StorageService,
    @InjectQueue(QUEUE_NAMES.OCR_PROCESSING) private ocrQueue: Queue<OcrJobData>,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload de documento para OCR' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_SIZE } }))
  async upload(
    @Param('companyId') companyId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de arquivo nao suportado. Use: ${ALLOWED_TYPES.join(', ')}`,
      );
    }

    const ctx = requireCurrentTenant();

    // Armazenar arquivo
    const storageKey = await this.storageService.upload(file.buffer, {
      tenantId: ctx.tenantId,
      folder: 'documents',
      fileName: file.originalname,
      contentType: file.mimetype,
    });

    // Criar registro
    const doc = await this.docModel.create({
      tenantId: ctx.tenantId,
      companyId,
      originalFileName: file.originalname,
      storageKey,
      contentType: file.mimetype,
      fileSize: file.size,
      status: DocumentStatus.Uploaded,
      createdBy: ctx.userId,
    });

    // Enfileirar processamento OCR
    await this.ocrQueue.add('ocr-process', {
      tenantContext: { tenantId: ctx.tenantId, userId: ctx.userId, role: ctx.role },
      companyId,
      documentId: doc._id.toString(),
    });

    return {
      id: doc._id,
      status: doc.status,
      message: 'Documento enviado. Processamento OCR iniciado.',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar documentos' })
  async findAll(
    @Param('companyId') companyId: string,
    @Query('status') status?: DocumentStatus,
  ) {
    const ctx = requireCurrentTenant();
    const filter: any = { tenantId: ctx.tenantId, companyId };
    if (status) filter.status = status;
    return this.docModel.find(filter).sort({ createdAt: -1 }).limit(100);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter documento com dados extraidos' })
  async findOne(@Param('companyId') companyId: string, @Param('id') id: string) {
    const ctx = requireCurrentTenant();
    return this.docModel.findOne({ _id: id, tenantId: ctx.tenantId, companyId });
  }
}
