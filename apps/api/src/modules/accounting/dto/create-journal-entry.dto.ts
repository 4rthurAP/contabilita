import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoLancamento } from '@contabilita/shared';

export class JournalEntryLineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  accountId: string;

  @ApiProperty({ example: '1000.00', description: 'Valor a debito' })
  @IsString()
  @MaxLength(50)
  debit: string;

  @ApiProperty({ example: '0', description: 'Valor a credito' })
  @IsString()
  @MaxLength(50)
  credit: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  costCenterId?: string;

  @ApiProperty({ example: 'Pagamento de fornecedor' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  historico: string;
}

export class CreateJournalEntryDto {
  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: TipoLancamento })
  @IsEnum(TipoLancamento)
  tipo: TipoLancamento;

  @ApiProperty({ example: 'Pagamento de fornecedor ref NF 1234' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @ApiProperty({ type: [JournalEntryLineDto] })
  @IsArray()
  @ArrayMinSize(2, { message: 'Lancamento deve ter pelo menos 2 linhas (debito e credito)' })
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines: JournalEntryLineDto[];
}
