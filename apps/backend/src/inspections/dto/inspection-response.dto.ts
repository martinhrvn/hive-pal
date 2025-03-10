import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { InspectionMetricsDto } from './inspection-metrics.dto';
import { IsDateString } from 'class-validator';

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

  @ApiProperty({ type: InspectionMetricsDto })
  @Expose()
  @Type(() => InspectionMetricsDto)
  observations: InspectionMetricsDto;
}
