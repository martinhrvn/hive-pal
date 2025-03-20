// inspection-filter.dto.ts
import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InspectionFilterDto {
  @IsOptional()
  @IsUUID()
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Unique identifier of the hive',
    required: false,
    nullable: true,
  })
  hiveId?: string;
}
