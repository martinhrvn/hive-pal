import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class InspectionMetricsDto {
  @ApiProperty({ type: Number, nullable: true, description: 'Colony strength rating' })
  @Expose()
  strength: number | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Amount of uncapped brood observed' })
  @Expose()
  uncappedBrood: number | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Amount of capped brood observed' })
  @Expose()
  cappedBrood: number | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Amount of honey stores observed' })
  @Expose()
  honeyStores: number | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Amount of pollen stores observed' })
  @Expose()
  pollenStores: number | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Number of queen cells observed' })
  @Expose()
  queenCells: number | null;

  @ApiProperty({ type: Boolean, nullable: true, description: 'Whether swarm cells were observed' })
  @Expose()
  swarmCells: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true, description: 'Whether supersedure cells were observed' })
  @Expose()
  supersedureCells: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true, description: 'Whether the queen was observed during inspection' })
  @Expose()
  queenSeen?: boolean | null;
}

export function isInspectionMetricsResponseDtoFilled(
  observation: InspectionMetricsDto,
): boolean {
  return (
    observation.strength !== null &&
    observation.uncappedBrood !== null &&
    observation.cappedBrood !== null &&
    observation.honeyStores !== null &&
    observation.pollenStores !== null &&
    observation.queenCells !== null &&
    observation.swarmCells !== null &&
    observation.supersedureCells !== null &&
    observation.queenSeen !== null
  );
}
