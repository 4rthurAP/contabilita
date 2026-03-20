import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RegimeTributario } from '@contabilita/shared';

class AddressDto {
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(50) cep?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(200) logradouro?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(20) numero?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(200) complemento?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(200) bairro?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(200) cidade?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(2) uf?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(20) codigoIbge?: string;
}

export class CreateCompanyDto {
  @ApiProperty({ example: '12345678000199', description: 'CNPJ sem pontuacao (14 digitos)' })
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter exatamente 14 digitos' })
  cnpj: string;

  @ApiProperty({ example: 'Empresa Exemplo Ltda' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  razaoSocial: string;

  @ApiPropertyOptional({ example: 'Exemplo' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nomeFantasia?: string;

  @ApiProperty({ enum: RegimeTributario })
  @IsEnum(RegimeTributario)
  regimeTributario: RegimeTributario;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  inscricaoEstadual?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  inscricaoMunicipal?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  codigoNaturezaJuridica?: string;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  endereco?: AddressDto;
}
