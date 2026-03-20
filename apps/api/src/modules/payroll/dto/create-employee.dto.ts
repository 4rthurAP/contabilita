import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class DependentDto {
  @ApiProperty() @IsString() @IsNotEmpty() nome: string;
  @ApiProperty() @IsString() @Matches(/^\d{11}$/) cpf: string;
  @ApiProperty() @IsDateString() dataNascimento: string;
  @ApiProperty() @IsString() parentesco: string;
}

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ example: '12345678901' })
  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF deve conter 11 digitos' })
  cpf: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  rg?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dataNascimento?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pis?: string;

  @ApiProperty({ example: 'Analista Contabil' })
  @IsString()
  @IsNotEmpty()
  cargo: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  departamento?: string;

  @ApiProperty({ example: '5000.00' })
  @IsString()
  @IsNotEmpty()
  salarioBase: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  dataAdmissao: string;

  @ApiPropertyOptional({ type: [DependentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DependentDto)
  @IsOptional()
  dependentes?: DependentDto[];
}
