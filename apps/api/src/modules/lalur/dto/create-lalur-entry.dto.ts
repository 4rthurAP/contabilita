import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLalurEntryDto {
  @ApiProperty() @IsNumber() year: number;
  @ApiProperty() @IsNumber() quarter: number;
  @ApiProperty({ enum: ['adicao', 'exclusao'] }) @IsEnum(['adicao', 'exclusao']) tipo: string;
  @ApiProperty() @IsString() @IsNotEmpty() descricao: string;
  @ApiProperty({ example: '1000.00' }) @IsString() valor: string;
  @ApiPropertyOptional() @IsString() @IsOptional() codigoContaRfb?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() balanceId?: string;
}

export class CreateLalurBalanceDto {
  @ApiProperty() @IsString() @IsNotEmpty() codigo: string;
  @ApiProperty() @IsString() @IsNotEmpty() descricao: string;
  @ApiProperty() @IsString() tipo: string;
  @ApiProperty() @IsString() saldoInicial: string;
  @ApiProperty() @IsNumber() year: number;
}
