import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { InspectionMetricsDto } from './inspection-metrics.dto';
import { IsDateString, IsEnum, ValidateNested } from 'class-validator';
import { InspectionScoreDto } from './inspection-score.dto';
import { InspectionStatus } from './inspection-status.enum';

import { ActionDto } from '../../actions/dto/create-action.dto';

export class InspectionResponseDto {
  @ApiProperty({ type: String, description: 'Unique ID of the inspection' })
  @Expose()
  id: string;

  @ApiProperty({
    type: String,
    description: 'ID of the hive this inspection belongs to',
  })
  @Expose()
  hiveId: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Date when the inspection was performed',
  })
  @Expose()
  @IsDateString()
  date: string;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Temperature during inspection',
    required: false,
  })
  @Expose()
  temperature: number | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Weather conditions during inspection',
    required: false,
  })
  @Expose()
  weatherConditions: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Additional notes about the inspection',
    required: false,
  })
  @Expose()
  notes: string | null;

  @ApiProperty({ type: InspectionMetricsDto })
  @Expose()
  @Type(() => InspectionMetricsDto)
  observations: InspectionMetricsDto;

  @ApiProperty({ type: InspectionScoreDto })
  @Expose()
  @Type(() => InspectionScoreDto)
  score: InspectionScoreDto;

  @ApiProperty({
    enum: InspectionStatus,
    enumName: 'InspectionStatus',
    description: 'Current status of the inspection',
  })
  @Expose()
  @IsEnum(InspectionStatus)
  status: InspectionStatus;

  @ApiProperty({
    description: 'Actions performed during the inspection',
    type: ActionDto,
    isArray: true,
  })
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => ActionDto)
  actions?: ActionDto[];
}
