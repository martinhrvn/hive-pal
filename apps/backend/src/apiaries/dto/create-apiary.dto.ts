import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateApiaryDto {
  @IsString()
  name: string;

  @IsString()
  location?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}
