import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoProtocolo } from '@contabilita/shared';

export class CreateProtocoloDto {
  @ApiProperty({ enum: TipoProtocolo })
  @IsEnum(TipoProtocolo)
  tipo: TipoProtocolo;

  @ApiProperty({ example: 'Documentos para declaracao IRPF 2026' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  descricao: string;

  @ApiPropertyOptional({ example: 'Joao Silva' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  remetente?: string;

  @ApiPropertyOptional({ example: 'Departamento Contabil' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  destinatario?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  observacoes?: string;
}
