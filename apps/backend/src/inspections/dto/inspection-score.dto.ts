import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class InspectionScoreDto {
  @Expose()
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Score for colony population and brood pattern (0-5 scale)',
    example: 4,
  })
  populationScore: number | null;

  @Expose()
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Score for queen performance and health (0-5 scale)',
    example: 4,
  })
  queenScore: number | null;

  @Expose()
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Score for honey and pollen stores (0-5 scale)',
    example: 3,
  })
  storesScore: number | null;

  @Expose()
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Overall health score for the colony (0-5 scale)',
    example: 4,
  })
  overallScore: number | null;

  @Expose()
  @ApiProperty({
    type: [String],
    description: 'List of warnings or issues detected during inspection',
    example: ['Low honey stores', 'Queen cells present'],
  })
  warnings: string[];
}
