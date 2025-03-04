import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateInspectionDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  hiveId: string;

  @IsDateString()
  date: Date;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsString()
  weatherConditions?: string;
}
