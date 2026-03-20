import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormaPagamento } from '@contabilita/shared';

export class CreateCobrancaDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(50) contratoId: string;
  @ApiProperty({ example: '2024/01' }) @IsString() @IsNotEmpty() @MaxLength(50) competencia: string;
  @ApiProperty() @IsDateString() dataVencimento: string;
  @ApiProperty({ example: '1500.00' }) @IsString() @IsNotEmpty() @MaxLength(50) valorPrincipal: string;
  @ApiPropertyOptional({ example: '0' }) @IsString() @IsOptional() @MaxLength(50) valorDesconto?: string;
  @ApiPropertyOptional({ example: '0' }) @IsString() @IsOptional() @MaxLength(50) valorJuros?: string;
  @ApiPropertyOptional({ enum: FormaPagamento }) @IsEnum(FormaPagamento) @IsOptional() formaPagamento?: FormaPagamento;
}
