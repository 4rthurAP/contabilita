import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
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
  descricao: string;

  @ApiProperty({ example: '84713012' })
  @IsString()
  ncm: string;

  @ApiProperty({ example: '5102' })
  @IsString()
  cfop: string;

  @ApiProperty({ example: '10' })
  @IsString()
  quantidade: string;

  @ApiProperty({ example: '100.00' })
  @IsString()
  valorUnitario: string;

  @ApiProperty({ example: '1000.00' })
  @IsString()
  valorTotal: string;
}

export class CreateInvoiceDto {
  @ApiProperty({ enum: TipoNotaFiscal })
  @IsEnum(TipoNotaFiscal)
  tipo: TipoNotaFiscal;

  @ApiProperty({ example: '000001' })
  @IsString()
  @IsNotEmpty()
  numero: string;

  @ApiProperty({ example: '1' })
  @IsString()
  serie: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  dataEmissao: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fornecedorClienteNome?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fornecedorClienteCnpj?: string;

  @ApiProperty({ type: [CreateInvoiceItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
