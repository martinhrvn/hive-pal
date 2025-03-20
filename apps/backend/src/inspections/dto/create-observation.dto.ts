import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateObservationDto {
  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Optional observation ID (generated if not provided)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({
    type: String,
    description: 'Type of observation',
    example: 'temperature'
  })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Numeric value for the observation',
    example: 32.5
  })
  @IsOptional()
  @IsNumber()
  numericValue?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Text value for the observation',
    example: 'Saw the queen'
  })
  @IsOptional()
  @IsString()
  textValue?: string;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Boolean value for the observation',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  booleanValue?: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Additional notes about the observation',
    example: 'Queen was marked with a blue dot'
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
