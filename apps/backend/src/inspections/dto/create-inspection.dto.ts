import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateObservationDto } from './create-observation.dto';

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateObservationDto)
  observations?: CreateObservationDto[];
}
