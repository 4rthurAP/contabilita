import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusProtocolo } from '@contabilita/shared';

export class UpdateProtocoloStatusDto {
  @ApiProperty({ enum: StatusProtocolo })
  @IsEnum(StatusProtocolo)
  status: StatusProtocolo;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  observacoes?: string;
}
