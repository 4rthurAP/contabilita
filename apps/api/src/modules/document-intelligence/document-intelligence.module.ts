import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UploadedDocument, UploadedDocumentSchema } from './schemas/document.schema';
import { DocumentIntelligenceController } from './document-intelligence.controller';
import { OcrProcessingProcessor } from './processors/ocr-processing.processor';
import { TenantModule } from '../tenant/tenant.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UploadedDocument.name, schema: UploadedDocumentSchema },
    ]),
    TenantModule,
    QueueModule,
  ],
  controllers: [DocumentIntelligenceController],
  providers: [OcrProcessingProcessor],
  exports: [],
})
export class DocumentIntelligenceModule {}
