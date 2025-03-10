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

  @IsBoolean()
  @IsOptional()
  swarmCells?: boolean | null;

  @IsBoolean()
  @IsOptional()
  supersedureCells?: boolean | null;

  @IsOptional()
  @IsBoolean()
  queenSeen?: boolean | null;
}
