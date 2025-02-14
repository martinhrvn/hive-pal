import { IsString, IsOptional, IsDate } from 'class-validator';

export class CreateHiveDto {
  @IsString()
  name: string;

  @IsString()
  apiaryId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDate()
  installationDate?: Date;
}
