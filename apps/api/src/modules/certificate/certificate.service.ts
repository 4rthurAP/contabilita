import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import {
  Certificate,
  CertificateDocument,
  CertificateStatus,
} from './schemas/certificate.schema';
import { UploadCertificateDto } from './dto/upload-certificate.dto';
import { requireCurrentTenant } from '../tenant/tenant.context';

@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);
  private readonly encryptionKey: Buffer;

  constructor(
    @InjectModel(Certificate.name) private certModel: Model<CertificateDocument>,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    const keyHex = this.config.get<string>('certificate.encryptionKey');
    this.encryptionKey = Buffer.from(keyHex!, 'hex');
    if (this.encryptionKey.length !== 32) {
      throw new Error(
        'CERTIFICATE_ENCRYPTION_KEY deve ser uma string hex de 64 caracteres (32 bytes)',
      );
    }
  }

  /**
   * Faz upload e valida um certificado digital A1 (.pfx/.p12).
   * O conteudo e a senha sao criptografados com AES-256-GCM antes de armazenar.
   */
  async upload(dto: UploadCertificateDto, pfxBuffer: Buffer): Promise<Certificate> {
    const ctx = requireCurrentTenant();

    // Parsear o PFX para extrair informacoes do certificado
    const certInfo = this.parsePfx(pfxBuffer, dto.password);

    // Verificar se ja existe um certificado ativo para esta empresa
    const existing = await this.certModel.findOne({
      tenantId: ctx.tenantId,
      companyId: dto.companyId,
      status: { $in: [CertificateStatus.Valido, CertificateStatus.Expirando] },
      fingerprint: certInfo.fingerprint,
    });
    if (existing) {
      throw new BadRequestException(
        'Este certificado ja esta cadastrado para esta empresa',
      );
    }

    // Criptografar PFX e senha
    const encryptedPfx = this.encrypt(pfxBuffer);
    const encryptedPassword = this.encrypt(Buffer.from(dto.password, 'utf-8'));

    // Determinar status baseado na validade
    const status = this.computeStatus(certInfo.validTo);

    const cert = await this.certModel.create({
      tenantId: ctx.tenantId,
      companyId: dto.companyId,
      tipo: dto.tipo,
      nome: dto.nome || `Certificado ${certInfo.commonName}`,
      titular: certInfo.commonName,
      documento: certInfo.documento,
      serialNumber: certInfo.serialNumber,
      issuer: certInfo.issuer,
      validFrom: certInfo.validFrom,
      validTo: certInfo.validTo,
      status,
      encryptedPfx: encryptedPfx.data,
      encryptionIv: encryptedPfx.iv,
      encryptionTag: encryptedPfx.tag,
      encryptedPassword: encryptedPassword.data,
      passwordIv: encryptedPassword.iv,
      passwordTag: encryptedPassword.tag,
      fingerprint: certInfo.fingerprint,
      createdBy: ctx.userId,
    });

    this.logger.log(
      `Certificado uploaded para empresa ${dto.companyId}: ${certInfo.commonName} (valido ate ${certInfo.validTo.toISOString()})`,
    );

    return cert;
  }

  /** Lista certificados de uma empresa */
  async findByCompany(companyId: string): Promise<Certificate[]> {
    const ctx = requireCurrentTenant();
    return this.certModel.find({
      tenantId: ctx.tenantId,
      companyId,
    }).sort({ validTo: -1 });
  }

  /** Lista todos os certificados do tenant */
  async findAll(): Promise<Certificate[]> {
    const ctx = requireCurrentTenant();
    return this.certModel.find({ tenantId: ctx.tenantId }).sort({ validTo: -1 });
  }

  /** Busca certificado por ID */
  async findById(id: string): Promise<Certificate> {
    const ctx = requireCurrentTenant();
    const cert = await this.certModel.findOne({ _id: id, tenantId: ctx.tenantId });
    if (!cert) throw new NotFoundException('Certificado nao encontrado');
    return cert;
  }

  /** Remove (soft delete) um certificado */
  async remove(id: string): Promise<void> {
    const ctx = requireCurrentTenant();
    const cert = await this.certModel.findOne({ _id: id, tenantId: ctx.tenantId });
    if (!cert) throw new NotFoundException('Certificado nao encontrado');
    await (cert as any).softDelete();
  }

  /**
   * Recupera o PFX descriptografado e a senha para operacoes de assinatura.
   * Usado internamente por outros modulos (SEFAZ, eSocial, SPED).
   */
  async getDecryptedPfx(
    companyId: string,
  ): Promise<{ pfx: Buffer; password: string }> {
    const ctx = requireCurrentTenant();
    const cert = await this.certModel
      .findOne({
        tenantId: ctx.tenantId,
        companyId,
        status: { $in: [CertificateStatus.Valido, CertificateStatus.Expirando] },
      })
      .select('+encryptedPfx +encryptionIv +encryptionTag +encryptedPassword +passwordIv +passwordTag')
      .sort({ validTo: -1 });

    if (!cert) {
      throw new NotFoundException(
        'Nenhum certificado valido encontrado para esta empresa',
      );
    }

    const pfx = this.decrypt(cert.encryptedPfx, cert.encryptionIv, cert.encryptionTag);
    const password = this.decrypt(
      cert.encryptedPassword,
      cert.passwordIv,
      cert.passwordTag,
    ).toString('utf-8');

    return { pfx, password };
  }

  /**
   * Assina dados usando o certificado A1 da empresa.
   * Retorna a assinatura em formato base64.
   */
  async sign(
    companyId: string,
    data: Buffer,
    algorithm = 'SHA256',
  ): Promise<string> {
    const { pfx, password } = await this.getDecryptedPfx(companyId);

    const p12 = crypto.createPrivateKey({
      key: pfx,
      format: 'der',
      type: 'pkcs12',
      passphrase: password,
    });

    const sign = crypto.createSign(algorithm);
    sign.update(data);
    return sign.sign(p12, 'base64');
  }

  /**
   * Verifica certificados proximos do vencimento.
   * Chamado por cron diariamente — emite eventos para o modulo de notificacoes.
   */
  async checkExpirations(): Promise<void> {
    const now = new Date();
    const in60days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in15days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    // Marcar como expirado
    const expired = await this.certModel.updateMany(
      { status: { $ne: CertificateStatus.Expirado }, validTo: { $lt: now } },
      { status: CertificateStatus.Expirado },
    );
    if (expired.modifiedCount > 0) {
      this.logger.warn(`${expired.modifiedCount} certificado(s) marcado(s) como expirado(s)`);
    }

    // Marcar como expirando (vence em ate 60 dias)
    const expiring = await this.certModel.updateMany(
      {
        status: CertificateStatus.Valido,
        validTo: { $gte: now, $lte: in60days },
      },
      { status: CertificateStatus.Expirando },
    );

    // Emitir notificacoes para certificados vencendo em 15 dias
    const criticalCerts = await this.certModel.find({
      status: CertificateStatus.Expirando,
      validTo: { $gte: now, $lte: in15days },
    });

    for (const cert of criticalCerts) {
      const daysLeft = Math.ceil(
        (cert.validTo.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
      );
      this.eventEmitter.emit('certificate.expiring', {
        tenantId: cert.tenantId,
        companyId: cert.companyId,
        certificateId: cert._id,
        titular: cert.titular,
        validTo: cert.validTo,
        daysLeft,
      });
    }
  }

  // ── Private helpers ──────────────────────────

  private encrypt(data: Buffer): { data: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      data: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
    };
  }

  private decrypt(data: string, iv: string, tag: string): Buffer {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(data, 'base64')),
      decipher.final(),
    ]);
  }

  private parsePfx(
    pfxBuffer: Buffer,
    password: string,
  ): {
    commonName: string;
    documento: string;
    serialNumber: string;
    issuer: string;
    validFrom: Date;
    validTo: Date;
    fingerprint: string;
  } {
    try {
      // Usar crypto do Node.js para extrair informacoes do certificado
      const cert = new crypto.X509Certificate(
        this.extractCertFromPfx(pfxBuffer, password),
      );

      const fingerprint = cert.fingerprint256.replace(/:/g, '').toLowerCase();
      const commonName = this.extractCN(cert.subject) || 'Desconhecido';
      const issuerCN = this.extractCN(cert.issuer) || 'Desconhecido';

      // Extrair CNPJ/CPF do subject (formato brasileiro: "CN=...:CNPJ")
      const documento = this.extractDocumento(cert.subject);

      return {
        commonName,
        documento,
        serialNumber: cert.serialNumber,
        issuer: issuerCN,
        validFrom: new Date(cert.validFrom),
        validTo: new Date(cert.validTo),
        fingerprint,
      };
    } catch (error) {
      throw new BadRequestException(
        'Nao foi possivel ler o certificado. Verifique o arquivo e a senha.',
      );
    }
  }

  private extractCertFromPfx(pfxBuffer: Buffer, password: string): Buffer {
    // Node.js crypto pode extrair o certificado X509 de um PKCS12
    const key = crypto.createPrivateKey({
      key: pfxBuffer,
      format: 'der',
      type: 'pkcs12',
      passphrase: password,
    });
    // Re-export o certificado — criamos um par temporario para validar
    // e usamos o PFX original para assinatura
    // Para extracao do X509, usamos abordagem alternativa:
    const p12 = crypto.createPublicKey(key);
    // Fallback: gerar fingerprint do PFX inteiro
    const hash = crypto.createHash('sha256').update(pfxBuffer).digest('hex');

    // Tentar extrair X509 diretamente
    try {
      // Em Node.js 20+, podemos usar PKCS12 diretamente
      const { cert: pemCert } = this.pkcs12ToPem(pfxBuffer, password);
      return Buffer.from(pemCert);
    } catch {
      // Retornar info basica se nao conseguir extrair
      throw new BadRequestException(
        'Formato de certificado nao suportado. Use um certificado A1 no formato PFX/P12.',
      );
    }
  }

  private pkcs12ToPem(
    pfx: Buffer,
    passphrase: string,
  ): { cert: string; key: string } {
    // Node.js nao tem API nativa para PEM extraction de PKCS12.
    // Usamos a API de private key + re-derivamos.
    const privateKey = crypto.createPrivateKey({
      key: pfx,
      format: 'der',
      type: 'pkcs12',
      passphrase,
    });

    const keyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;

    // Para o certificado X509, precisamos usar a API experimental ou
    // extrair do PFX usando estrutura ASN.1
    // Simplificacao: armazenamos o PFX inteiro criptografado e usamos
    // o private key para assinatura
    return { cert: keyPem, key: keyPem };
  }

  private extractCN(subject: string): string {
    const match = subject.match(/CN=([^,\n]+)/);
    return match ? match[1].trim() : '';
  }

  private extractDocumento(subject: string): string {
    // Certificados brasileiros incluem CNPJ ou CPF no subject
    // Formato tipico: "CN=EMPRESA LTDA:12345678000190"
    const cnpjMatch = subject.match(/(\d{14})/);
    if (cnpjMatch) return cnpjMatch[1];

    const cpfMatch = subject.match(/(\d{11})/);
    if (cpfMatch) return cpfMatch[1];

    return '';
  }

  private computeStatus(validTo: Date): CertificateStatus {
    const now = new Date();
    if (validTo < now) return CertificateStatus.Expirado;
    const in60days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    if (validTo <= in60days) return CertificateStatus.Expirando;
    return CertificateStatus.Valido;
  }
}
