import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLalurEntryDto {
  @ApiProperty() @IsNumber() year: number;
  @ApiProperty() @IsNumber() quarter: number;
  @ApiProperty({ enum: ['adicao', 'exclusao'] }) @IsEnum(['adicao', 'exclusao']) tipo: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) descricao: string;
  @ApiProperty({ example: '1000.00' }) @IsString() @MaxLength(50) valor: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(50) codigoContaRfb?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(50) balanceId?: string;
}

export class CreateLalurBalanceDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(50) codigo: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) descricao: string;
  @ApiProperty() @IsString() @MaxLength(50) tipo: string;
  @ApiProperty() @IsString() @MaxLength(50) saldoInicial: string;
  @ApiProperty() @IsNumber() year: number;
}
