import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateInspectionDto } from './create-inspection.dto';
import { IsEnum, IsUUID, ValidateNested } from 'class-validator';
import { InspectionStatus } from './inspection-status.enum';
import { Type } from 'class-transformer';
import { CreateActionDto } from './create-actions.dto';

export class UpdateInspectionDto extends PartialType(CreateInspectionDto) {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'ID of the inspection to update',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    enum: InspectionStatus,
    enumName: 'InspectionStatus',
    description: 'Current status of the inspection',
    example: 'COMPLETED',
  })
  @IsEnum(InspectionStatus)
  status: InspectionStatus;
  
  @ApiPropertyOptional({
    type: [CreateActionDto],
    description: 'Actions performed during the inspection',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateActionDto)
  actions?: CreateActionDto[];
}
