import { IsEnum, IsOptional, IsString, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrioridadeTarefa, CategoriaTarefa } from '@contabilita/shared';

export class CreateTarefaDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  titulo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descricao?: string;

  @ApiPropertyOptional({ enum: PrioridadeTarefa })
  @IsOptional()
  @IsEnum(PrioridadeTarefa)
  prioridade?: PrioridadeTarefa;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  prazo?: string;

  @ApiPropertyOptional({ enum: CategoriaTarefa })
  @IsOptional()
  @IsEnum(CategoriaTarefa)
  categoria?: CategoriaTarefa;
}

export class UpdateTarefaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titulo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descricao?: string;

  @ApiPropertyOptional({ enum: PrioridadeTarefa })
  @IsOptional()
  @IsEnum(PrioridadeTarefa)
  prioridade?: PrioridadeTarefa;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  prazo?: string;

  @ApiPropertyOptional({ enum: CategoriaTarefa })
  @IsOptional()
  @IsEnum(CategoriaTarefa)
  categoria?: CategoriaTarefa;
}
