import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetodoDepreciacao } from '@contabilita/shared';

export class CreateAssetDto {
  @ApiProperty() @IsString() @IsNotEmpty() codigo: string;
  @ApiProperty() @IsString() @IsNotEmpty() descricao: string;
  @ApiProperty() @IsString() @IsNotEmpty() grupo: string;
  @ApiProperty() @IsDateString() dataAquisicao: string;
  @ApiProperty({ example: '50000.00' }) @IsString() valorAquisicao: string;
  @ApiPropertyOptional() @IsString() @IsOptional() valorResidual?: string;
  @ApiProperty({ example: '0.10', description: 'Taxa anual (10% = 0.10)' }) @IsString() taxaDepreciacao: string;
  @ApiProperty({ example: 120 }) @IsNumber() vidaUtilMeses: number;
  @ApiProperty({ enum: MetodoDepreciacao }) @IsEnum(MetodoDepreciacao) metodoDepreciacao: MetodoDepreciacao;
  @ApiPropertyOptional() @IsString() @IsOptional() notaFiscal?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() fornecedor?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() localizacao?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() ciap?: boolean;
}
