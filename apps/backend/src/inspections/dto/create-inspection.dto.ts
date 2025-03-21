import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateInspectionObservationsDto } from './create-inspections-observations.dto';

export class CreateInspectionDto {
  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Optional inspection ID (generated if not provided)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'ID of the hive being inspected',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  hiveId: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Date when the inspection was performed',
    example: '2025-03-20T10:00:00Z',
  })
  @IsDateString()
  date: Date;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Temperature during inspection (in celsius)',
    example: 22.5,
  })
  @IsOptional()
  @IsNumber()
  temperature?: number | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Weather conditions during inspection',
    example: 'Sunny with light breeze',
  })
  @IsOptional()
  @IsString()
  weatherConditions?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Additional notes about the inspection',
    example: 'Colony appears healthy and active',
  })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({
    type: () => CreateInspectionObservationsDto,
    description: 'Observations and metrics recorded during inspection',
  })
  @IsOptional()
  @Type(() => CreateInspectionObservationsDto)
  observations?: CreateInspectionObservationsDto;
}
