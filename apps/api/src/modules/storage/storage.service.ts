import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Servico de armazenamento de arquivos.
 *
 * Suporta dois backends:
 * - 'local': armazena em disco (dev/staging)
 * - 's3': armazena em S3/MinIO (producao)
 *
 * Quando S3 nao estiver configurado, usa armazenamento local automaticamente.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly backend: 'local' | 's3';
  private readonly localPath: string;
  private s3Client: any;
  private bucket: string;

  constructor(private readonly config: ConfigService) {
    const s3Endpoint = this.config.get<string>('STORAGE_S3_ENDPOINT');
    this.bucket = this.config.get<string>('STORAGE_S3_BUCKET') || 'contabilita';
    this.localPath = this.config.get<string>('STORAGE_LOCAL_PATH') || '/tmp/contabilita-storage';

    if (s3Endpoint) {
      this.backend = 's3';
      this.initS3(s3Endpoint);
    } else {
      this.backend = 'local';
      fs.mkdirSync(this.localPath, { recursive: true });
      this.logger.log(`Storage: usando armazenamento local em ${this.localPath}`);
    }
  }

  private async initS3(endpoint: string) {
    try {
      const { S3Client } = await import('@aws-sdk/client-s3');
      this.s3Client = new S3Client({
        endpoint,
        region: this.config.get<string>('STORAGE_S3_REGION') || 'us-east-1',
        credentials: {
          accessKeyId: this.config.get<string>('STORAGE_S3_ACCESS_KEY') || 'minioadmin',
          secretAccessKey: this.config.get<string>('STORAGE_S3_SECRET_KEY') || 'minioadmin',
        },
        forcePathStyle: true,
      });
      this.logger.log(`Storage: usando S3 em ${endpoint}`);
    } catch {
      this.logger.warn('S3 SDK nao disponivel, fallback para storage local');
      this.backend = 'local' as any;
      fs.mkdirSync(this.localPath, { recursive: true });
    }
  }

  /**
   * Armazena um arquivo e retorna a chave (path) para recuperacao.
   */
  async upload(
    buffer: Buffer,
    options: {
      tenantId: string;
      folder: string; // 'documents', 'certidoes', 'reports'
      fileName: string;
      contentType?: string;
    },
  ): Promise<string> {
    const hash = crypto.createHash('md5').update(buffer).digest('hex').slice(0, 8);
    const key = `${options.tenantId}/${options.folder}/${hash}_${options.fileName}`;

    if (this.backend === 's3' && this.s3Client) {
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: options.contentType || 'application/octet-stream',
        }),
      );
    } else {
      const filePath = path.join(this.localPath, key);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, buffer);
    }

    return key;
  }

  /**
   * Recupera um arquivo pelo path/key.
   */
  async download(key: string): Promise<Buffer> {
    if (this.backend === 's3' && this.s3Client) {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const response = await this.s3Client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      const chunks: Buffer[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } else {
      const filePath = path.join(this.localPath, key);
      return fs.readFileSync(filePath);
    }
  }

  /**
   * Remove um arquivo.
   */
  async delete(key: string): Promise<void> {
    if (this.backend === 's3' && this.s3Client) {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      await this.s3Client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } else {
      const filePath = path.join(this.localPath, key);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }
}
