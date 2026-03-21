import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBankAccountDto {
  @ApiProperty({ example: '001', description: 'Codigo do banco (COMPE)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  codigoBanco: string;

  @ApiProperty({ example: 'Banco do Brasil' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nomeBanco: string;

  @ApiProperty({ example: '1234-5' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  agencia: string;

  @ApiProperty({ example: '12345-6' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  numeroConta: string;

  @ApiProperty({ example: 'Conta Principal BB' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apelido: string;

  @ApiPropertyOptional({ description: 'ID da conta contabil associada' })
  @IsString()
  @IsOptional()
  contaContabilId?: string;
}
