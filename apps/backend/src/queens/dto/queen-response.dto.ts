import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum QueenStatus {
  ACTIVE = 'ACTIVE',
  REPLACED = 'REPLACED',
  DEAD = 'DEAD',
  UNKNOWN = 'UNKNOWN',
}

export class QueenResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  hiveId?: string | null;

  @ApiProperty()
  @Expose()
  @IsOptional()
  marking: string | null;

  @ApiProperty()
  @Expose()
  @IsOptional()
  color: string | null;

  @ApiProperty()
  @Expose()
  year: number;

  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  source: string | null;

  @ApiProperty({ required: false })
  @Expose()
  @IsEnum(QueenStatus)
  status: QueenStatus | null;

  @ApiProperty({ required: false })
  @Expose()
  @IsDateString()
  installedAt?: string | null;

  @ApiProperty({ required: false })
  @Expose()
  @IsDateString()
  replacedAt?: string | null;
}
