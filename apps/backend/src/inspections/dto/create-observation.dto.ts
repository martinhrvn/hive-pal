import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateObservationDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  @IsNumber()
  numericValue?: number;

  @IsOptional()
  @IsString()
  textValue?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}