import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class CreateInspectionObservationsDto {
  @IsNumber()
  @IsOptional()
  strength?: number | null;

  @IsNumber()
  @IsOptional()
  uncappedBrood?: number | null;

  @IsNumber()
  @IsOptional()
  cappedBrood?: number | null;

  @IsNumber()
  @IsOptional()
  honeyStores?: number | null;

  @IsNumber()
  @IsOptional()
  pollenStores?: number | null;

  @IsNumber()
  @IsOptional()
  queenCells?: number | null;

  @IsNumber()
  @IsOptional()
  swarmCells?: number | null;

  @IsNumber()
  @IsOptional()
  supersedureCells?: number | null;

  @IsOptional()
  @IsBoolean()
  queenSeen?: boolean | null;
}
