import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ImportXmlDto {
  @ApiProperty({ description: 'Conteudo XML da NF-e' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500000)
  xml: string;
}
