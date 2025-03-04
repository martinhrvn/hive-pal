import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class InspectionResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  hiveId: string;

  @ApiProperty()
  @Expose()
  date: Date;

  @ApiProperty()
  @Expose()
  temperature: number | null;

  @ApiProperty()
  @Expose()
  weatherConditions: string | null;
}
