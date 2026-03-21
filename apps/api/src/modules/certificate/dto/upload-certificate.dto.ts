import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CertificateType } from '../schemas/certificate.schema';

export class UploadCertificateDto {
  @ApiProperty({ description: 'ID da empresa associada' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ enum: CertificateType, default: CertificateType.A1 })
  @IsEnum(CertificateType)
  tipo: CertificateType;

  @ApiPropertyOptional({ description: 'Nome amigavel (ex: "Cert Principal 2025")' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nome?: string;

  @ApiProperty({ description: 'Senha do arquivo PFX' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
