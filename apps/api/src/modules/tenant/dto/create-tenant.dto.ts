import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Contabilidade Silva & Associados' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'silva-associados' })
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug deve conter apenas letras minusculas, numeros e hifens' })
  slug: string;

  @ApiProperty({ example: '12345678000199', description: 'CNPJ sem pontuacao (14 digitos)' })
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter exatamente 14 digitos' })
  cnpj: string;
}
