import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ImportXmlDto {
  @ApiProperty({ description: 'Conteudo XML da NF-e' })
  @IsString()
  @IsNotEmpty()
  xml: string;
}
