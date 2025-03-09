import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ObservationResponseDto {
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
  swarmCells: number | null;

  @ApiProperty()
  @Expose()
  supersedureCells: number | null;

  @ApiProperty()
  @Expose()
  queenSeen?: boolean;
}
