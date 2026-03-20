import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoConta, NaturezaConta } from '@contabilita/shared';

export class CreateAccountDto {
  @ApiProperty({ example: '1.1.01.001' })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiProperty({ example: 'Caixa Geral' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ enum: TipoConta })
  @IsEnum(TipoConta)
  tipo: TipoConta;

  @ApiProperty({ enum: NaturezaConta })
  @IsEnum(NaturezaConta)
  natureza: NaturezaConta;

  @ApiProperty({ example: 4 })
  @IsNumber()
  nivel: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  isAnalytical: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  codigoReferencialRfb?: string;
}
