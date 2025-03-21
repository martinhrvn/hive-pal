import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateApiaryDto {
  @ApiProperty({
    type: String,
    description: 'Name of the apiary',
    example: 'Meadow Apiary',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Location description of the apiary',
    example: 'Behind the barn',
  })
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Latitude coordinate of the apiary',
    example: 40.7128,
  })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Longitude coordinate of the apiary',
    example: -74.006,
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}
