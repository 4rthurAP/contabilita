import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RegimeTributario } from '@contabilita/shared';

class AddressDto {
  @ApiPropertyOptional() @IsString() @IsOptional() cep?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() logradouro?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() numero?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() complemento?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() bairro?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() cidade?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() uf?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() codigoIbge?: string;
}

export class CreateCompanyDto {
  @ApiProperty({ example: '12345678000199', description: 'CNPJ sem pontuacao (14 digitos)' })
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter exatamente 14 digitos' })
  cnpj: string;

  @ApiProperty({ example: 'Empresa Exemplo Ltda' })
  @IsString()
  @IsNotEmpty()
  razaoSocial: string;

  @ApiPropertyOptional({ example: 'Exemplo' })
  @IsString()
  @IsOptional()
  nomeFantasia?: string;

  @ApiProperty({ enum: RegimeTributario })
  @IsEnum(RegimeTributario)
  regimeTributario: RegimeTributario;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  inscricaoEstadual?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  inscricaoMunicipal?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  codigoNaturezaJuridica?: string;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  endereco?: AddressDto;
}
