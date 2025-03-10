import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class InspectionScoreDto {
  @Expose()
  @ApiProperty()
  populationScore: number | null;
  @Expose()
  @ApiProperty()
  queenScore: number | null;
  @Expose()
  @ApiProperty()
  storesScore: number | null;
  @Expose()
  @ApiProperty()
  overallScore: number | null;
  @Expose()
  @ApiProperty()
  warnings: string[];
}
