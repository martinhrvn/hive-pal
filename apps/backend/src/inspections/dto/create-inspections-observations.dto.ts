import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInspectionObservationsDto {
  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Colony strength rating (typically 1-5 scale)',
    example: 4
  })
  @IsNumber()
  @IsOptional()
  strength?: number | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Amount of uncapped brood observed (typically 0-5 scale)',
    example: 3
  })
  @IsNumber()
  @IsOptional()
  uncappedBrood?: number | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Amount of capped brood observed (typically 0-5 scale)',
    example: 4
  })
  @IsNumber()
  @IsOptional()
  cappedBrood?: number | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Amount of honey stores observed (typically 0-5 scale)',
    example: 5
  })
  @IsNumber()
  @IsOptional()
  honeyStores?: number | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Amount of pollen stores observed (typically 0-5 scale)',
    example: 3
  })
  @IsNumber()
  @IsOptional()
  pollenStores?: number | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Number of queen cells observed',
    example: 2
  })
  @IsNumber()
  @IsOptional()
  queenCells?: number | null;

  @ApiPropertyOptional({
    type: Boolean,
    nullable: true,
    description: 'Whether swarm cells were observed',
    example: false
  })
  @IsBoolean()
  @IsOptional()
  swarmCells?: boolean | null;

  @ApiPropertyOptional({
    type: Boolean,
    nullable: true,
    description: 'Whether supersedure cells were observed',
    example: false
  })
  @IsBoolean()
  @IsOptional()
  supersedureCells?: boolean | null;

  @ApiPropertyOptional({
    type: Boolean,
    nullable: true,
    description: 'Whether the queen was observed during inspection',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  queenSeen?: boolean | null;
}
