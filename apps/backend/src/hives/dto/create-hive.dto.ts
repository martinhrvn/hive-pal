import { HiveStatus } from '@prisma/client';
import { IsString, IsOptional, IsDate, IsEnum } from 'class-validator';

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

  @IsOptional()
  @IsEnum(HiveStatus)
  status: HiveStatus;
}
