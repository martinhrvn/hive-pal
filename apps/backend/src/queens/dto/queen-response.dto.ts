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
  @ApiProperty({ type: String, description: 'Unique ID of the queen' })
  @Expose()
  id: string;

  @ApiProperty({ type: String, required: false, nullable: true, description: 'ID of the hive this queen belongs to' })
  @Expose()
  @IsOptional()
  hiveId?: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Queen marking code' })
  @Expose()
  @IsOptional()
  marking: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Queen color marking' })
  @Expose()
  @IsOptional()
  color: string | null;

  @ApiProperty({ type: Number, description: 'Birth year of the queen' })
  @Expose()
  year: number;

  @ApiProperty({ required: false, type: String })
  @Expose()
  @IsOptional()
  source: string | null;

  @ApiProperty({ required: false, enum: QueenStatus })
  @Expose()
  @IsEnum(QueenStatus)
  status: QueenStatus | null;

  @ApiProperty({ required: false, type: String })
  @Expose()
  @IsDateString()
  installedAt?: string | null;

  @ApiProperty({ required: false, type: String })
  @Expose()
  @IsDateString()
  replacedAt?: string | null;
}
