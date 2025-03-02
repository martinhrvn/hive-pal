// inspection-filter.dto.ts
import { IsOptional, IsUUID } from 'class-validator';

export class InspectionFilterDto {
  @IsOptional()
  @IsUUID()
  hiveId?: string;
}
