import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { InspectionMetricsDto } from './inspection-metrics.dto';
import { IsDateString } from 'class-validator';
import { InspectionScoreDto } from './inspection-score.dto';

export class InspectionResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  hiveId: string;

  @ApiProperty()
  @Expose()
  @IsDateString()
  date: string;

  @ApiProperty({ required: false })
  @Expose()
  temperature: number | null;

  @ApiProperty({ required: false })
  @Expose()
  weatherConditions: string | null;

  @ApiProperty({ required: false })
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
}
