import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInspectionObservationsDto } from './create-inspections-observations.dto';

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
  temperature?: number | null;

  @IsOptional()
  @IsString()
  weatherConditions?: string | null;

  @IsOptional()
  @Type(() => CreateInspectionObservationsDto)
  observations?: CreateInspectionObservationsDto;
}
