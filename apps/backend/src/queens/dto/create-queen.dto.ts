import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { QueenStatus } from './queen-response.dto';

export class CreateQueenDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    required: false,
    description: 'ID of the hive this queen belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsString()
  hiveId?: string;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'Optional marking, usually number or similar',
    example: 'Yellow dot'
  })
  @IsOptional()
  @IsString()
  marking: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'Optional color of the queen',
    example: 'Yellow'
  })
  @IsOptional()
  @IsString()
  color: string | null;

  @ApiProperty({
    type: Number,
    description: 'Birth year of the queen',
    example: 2025
  })
  @Expose()
  @IsNumber()
  year: number;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'Source of the queen (breeder, etc.)',
    example: 'Local breeder'
  })
  @IsOptional()
  @IsString()
  source?: string | null;

  @ApiProperty({
    enum: QueenStatus,
    enumName: 'QueenStatus',
    required: false,
    nullable: true,
    description: 'Current status of the queen',
    example: 'ACTIVE'
  })
  @IsEnum(QueenStatus)
  status: QueenStatus | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    required: false,
    nullable: true,
    description: 'Date when the queen was installed',
    example: '2025-03-20T10:00:00Z'
  })
  @Expose()
  @IsDateString()
  installedAt?: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    required: false,
    nullable: true,
    description: 'Date when the queen was replaced',
    example: '2025-04-15T10:00:00Z'
  })
  @Expose()
  @IsDateString()
  @IsOptional()
  replacedAt?: string | null;
}
