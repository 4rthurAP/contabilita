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
  private backend: 'local' | 's3';
  private readonly localPath: string;
  private s3Client: any;
  private bucket: string;
  private s3Ready: Promise<void> | null = null;

  constructor(private readonly config: ConfigService) {
    const s3Endpoint = this.config.get<string>('STORAGE_S3_ENDPOINT');
    this.bucket = this.config.get<string>('STORAGE_S3_BUCKET') || 'contabilita';
    this.localPath = this.config.get<string>('STORAGE_LOCAL_PATH') || '/tmp/contabilita-storage';

    if (s3Endpoint) {
      this.backend = 's3';
      this.s3Ready = this.initS3(s3Endpoint);
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
      await this.ensureBucket();
      this.logger.log(`Storage: usando S3 em ${endpoint}`);
    } catch {
      this.logger.warn('S3 SDK nao disponivel, fallback para storage local');
      this.backend = 'local';
      fs.mkdirSync(this.localPath, { recursive: true });
    }
  }

  private async ensureBucket() {
    try {
      const { HeadBucketCommand, CreateBucketCommand } = await import('@aws-sdk/client-s3');
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        const { CreateBucketCommand } = await import('@aws-sdk/client-s3');
        await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Bucket '${this.bucket}' criado`);
      } catch (createErr) {
        this.logger.warn(`Nao foi possivel criar bucket '${this.bucket}': ${createErr}`);
      }
    }
  }

  private async awaitReady() {
    if (this.s3Ready) await this.s3Ready;
  }

  /**
   * Armazena um arquivo e retorna a chave (path) para recuperacao.
   */
  async upload(
    buffer: Buffer,
    options: {
      tenantId: string;
      folder: string; // 'documents', 'sped', 'certidoes', 'reports'
      fileName: string;
      contentType?: string;
    },
  ): Promise<string> {
    await this.awaitReady();
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
    await this.awaitReady();
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
   * Gera uma URL pre-assinada para download direto (S3) ou retorna path da API (local).
   */
  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    await this.awaitReady();
    if (this.backend === 's3' && this.s3Client) {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      return getSignedUrl(this.s3Client, command, { expiresIn });
    }
    return `/api/storage/download?key=${encodeURIComponent(key)}`;
  }

  /**
   * Remove um arquivo.
   */
  async delete(key: string): Promise<void> {
    await this.awaitReady();
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
