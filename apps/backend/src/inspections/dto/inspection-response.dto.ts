import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ObservationResponseDto } from './observation-response.dto';
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

  @ApiProperty({ type: ObservationResponseDto })
  @Expose()
  @Type(() => ObservationResponseDto)
  observations: ObservationResponseDto;
}
