import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PeriodicidadeContrato } from '@contabilita/shared';

export class CreateContratoDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) descricao: string;
  @ApiProperty({ example: '1500.00' }) @IsString() @IsNotEmpty() @MaxLength(50) valorMensal: string;
  @ApiProperty() @IsDateString() dataInicio: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() dataFim?: string;
  @ApiProperty({ enum: PeriodicidadeContrato }) @IsEnum(PeriodicidadeContrato) @IsOptional() periodicidade?: PeriodicidadeContrato;
  @ApiProperty({ example: 10 }) @IsNumber() @Min(1) @Max(28) diaVencimento: number;
  @ApiPropertyOptional({ type: [String] }) @IsArray() @IsString({ each: true }) @IsOptional() servicosIncluidos?: string[];
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(2000) observacoes?: string;
}
