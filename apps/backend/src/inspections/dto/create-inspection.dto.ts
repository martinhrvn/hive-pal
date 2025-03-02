import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateInspectionDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  hiveId: string;

  @IsDateString()
  date: Date;
}
