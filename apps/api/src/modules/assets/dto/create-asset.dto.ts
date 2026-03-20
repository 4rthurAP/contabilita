import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetodoDepreciacao } from '@contabilita/shared';

export class CreateAssetDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(50) codigo: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) descricao: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(50) grupo: string;
  @ApiProperty() @IsDateString() dataAquisicao: string;
  @ApiProperty({ example: '50000.00' }) @IsString() @MaxLength(50) valorAquisicao: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(50) valorResidual?: string;
  @ApiProperty({ example: '0.10', description: 'Taxa anual (10% = 0.10)' }) @IsString() @MaxLength(50) taxaDepreciacao: string;
  @ApiProperty({ example: 120 }) @IsNumber() vidaUtilMeses: number;
  @ApiProperty({ enum: MetodoDepreciacao }) @IsEnum(MetodoDepreciacao) metodoDepreciacao: MetodoDepreciacao;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(50) notaFiscal?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(200) fornecedor?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(200) localizacao?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() ciap?: boolean;
}
