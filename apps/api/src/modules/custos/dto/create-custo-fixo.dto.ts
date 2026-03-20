import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoCustoFixo } from '@contabilita/shared';

export class CreateCustoFixoDto {
  @ApiProperty({ example: 'Aluguel do escritorio' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  descricao: string;

  @ApiProperty({ example: '3500.00' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  valorMensal: string;

  @ApiProperty({ enum: TipoCustoFixo })
  @IsEnum(TipoCustoFixo)
  tipo: TipoCustoFixo;
}
