import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoriaAtividade } from '@contabilita/shared';

export class CreateTimeEntryDto {
  @ApiProperty({ example: '60a7b2c3d4e5f6a7b8c9d0e1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  companyId: string;

  @ApiProperty({ example: '2026-03-20' })
  @IsDateString()
  data: string;

  @ApiProperty({ example: 60, description: 'Duracao em minutos' })
  @IsNumber()
  @Min(1)
  duracao: number;

  @ApiPropertyOptional({ example: 'Escrituracao contabil mensal' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  descricao?: string;

  @ApiProperty({ enum: CategoriaAtividade })
  @IsEnum(CategoriaAtividade)
  categoria: CategoriaAtividade;
}
