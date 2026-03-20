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
import { TipoNotaFiscal } from '@contabilita/shared';

export class CreateInvoiceItemDto {
  @ApiProperty({ example: 'Produto X' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  descricao: string;

  @ApiProperty({ example: '84713012' })
  @IsString()
  @MaxLength(50)
  ncm: string;

  @ApiProperty({ example: '5102' })
  @IsString()
  @MaxLength(50)
  cfop: string;

  @ApiProperty({ example: '10' })
  @IsString()
  @MaxLength(50)
  quantidade: string;

  @ApiProperty({ example: '100.00' })
  @IsString()
  @MaxLength(50)
  valorUnitario: string;

  @ApiProperty({ example: '1000.00' })
  @IsString()
  @MaxLength(50)
  valorTotal: string;
}

export class CreateInvoiceDto {
  @ApiProperty({ enum: TipoNotaFiscal })
  @IsEnum(TipoNotaFiscal)
  tipo: TipoNotaFiscal;

  @ApiProperty({ example: '000001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  numero: string;

  @ApiProperty({ example: '1' })
  @IsString()
  @MaxLength(50)
  serie: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  dataEmissao: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  fornecedorClienteNome?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  fornecedorClienteCnpj?: string;

  @ApiProperty({ type: [CreateInvoiceItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
