import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class DependentDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) nome: string;
  @ApiProperty() @IsString() @Matches(/^\d{11}$/) cpf: string;
  @ApiProperty() @IsDateString() dataNascimento: string;
  @ApiProperty() @IsString() @MaxLength(50) parentesco: string;
}

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nome: string;

  @ApiProperty({ example: '12345678901' })
  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF deve conter 11 digitos' })
  cpf: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  rg?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dataNascimento?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  pis?: string;

  @ApiProperty({ example: 'Analista Contabil' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  cargo: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  departamento?: string;

  @ApiProperty({ example: '5000.00' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
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
