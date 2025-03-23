import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { InspectionMetricsDto } from './inspection-metrics.dto';
import { IsDateString, IsEnum } from 'class-validator';
import { InspectionScoreDto } from './inspection-score.dto';
import { InspectionStatus } from './inspection-status.enum';
import { ActionType } from './create-actions.dto';

export class FeedingActionResponseDto {
  @ApiProperty({ description: 'Type of feed' })
  @Expose()
  feedType: string;

  @ApiProperty({ description: 'Amount of feed' })
  @Expose()
  amount: number;

  @ApiProperty({ description: 'Unit of measurement' })
  @Expose()
  unit: string;

  @ApiProperty({ description: 'Concentration of feed', required: false })
  @Expose()
  concentration?: string;
}

export class TreatmentActionResponseDto {
  @ApiProperty({ description: 'Treatment product name' })
  @Expose()
  product: string;

  @ApiProperty({ description: 'Quantity of treatment' })
  @Expose()
  quantity: number;

  @ApiProperty({ description: 'Unit of measurement' })
  @Expose()
  unit: string;

  @ApiProperty({ description: 'Duration of treatment', required: false })
  @Expose()
  duration?: string;
}

export class FrameActionResponseDto {
  @ApiProperty({ description: 'Number of frames added or removed' })
  @Expose()
  quantity: number;
}

export class ActionResponseDto {
  @ApiProperty({ description: 'Unique ID of the action' })
  @Expose()
  id: string;

  @ApiProperty({ enum: ActionType, description: 'Type of action performed' })
  @Expose()
  @IsEnum(ActionType)
  type: ActionType;

  @ApiProperty({ description: 'Additional notes about the action', required: false })
  @Expose()
  notes?: string;

  @ApiProperty({ type: FeedingActionResponseDto, required: false })
  @Expose()
  @Type(() => FeedingActionResponseDto)
  feedingAction?: FeedingActionResponseDto;

  @ApiProperty({ type: TreatmentActionResponseDto, required: false })
  @Expose()
  @Type(() => TreatmentActionResponseDto)
  treatmentAction?: TreatmentActionResponseDto;

  @ApiProperty({ type: FrameActionResponseDto, required: false })
  @Expose()
  @Type(() => FrameActionResponseDto)
  frameAction?: FrameActionResponseDto;
}

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
  
  @ApiProperty({ type: [ActionResponseDto], description: 'Actions performed during the inspection' })
  @Expose()
  @Type(() => ActionResponseDto)
  actions?: ActionResponseDto[];
}