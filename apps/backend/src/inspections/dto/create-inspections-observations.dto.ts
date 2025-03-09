import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class CreateInspectionObservationsDto {
  @IsNumber()
  @IsOptional()
  strength?: number;

  @IsNumber()
  @IsOptional()
  uncappedBrood?: number;

  @IsNumber()
  @IsOptional()
  cappedBrood?: number;

  @IsNumber()
  @IsOptional()
  honeyStores?: number;

  @IsNumber()
  @IsOptional()
  pollenStores?: number;

  @IsNumber()
  @IsOptional()
  queenCells?: number;

  @IsNumber()
  @IsOptional()
  swarmCells?: number;

  @IsNumber()
  @IsOptional()
  supersedureCells?: number;

  @IsOptional()
  @IsBoolean()
  queenSeen?: boolean;
}
