import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class InspectionMetricsDto {
  @ApiProperty()
  @Expose()
  strength: number | null;

  @ApiProperty()
  @Expose()
  uncappedBrood: number | null;

  @ApiProperty()
  @Expose()
  cappedBrood: number | null;

  @ApiProperty()
  @Expose()
  honeyStores: number | null;

  @ApiProperty()
  @Expose()
  pollenStores: number | null;

  @ApiProperty()
  @Expose()
  queenCells: number | null;

  @ApiProperty()
  @Expose()
  swarmCells: boolean | null;

  @ApiProperty()
  @Expose()
  supersedureCells: boolean | null;

  @ApiProperty()
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
