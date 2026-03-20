import { IsEnum, IsOptional, IsString, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoRegistro } from '@contabilita/shared';

export class CreateRegistroDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  companyId?: string;

  @ApiProperty({ enum: TipoRegistro })
  @IsEnum(TipoRegistro)
  tipo: TipoRegistro;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoes?: string;
}

export class CreateAtividadeRegistroDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  descricao: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  responsavel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  prazo?: string;
}
