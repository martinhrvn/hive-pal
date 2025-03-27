import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateInspectionDto } from './create-inspection.dto';
import { IsEnum, IsUUID, ValidateNested } from 'class-validator';
import { InspectionStatus } from './inspection-status.enum';
import { Type } from 'class-transformer';
import { ActionDtoSchema } from '../../actions/dto/action-response.dto';
import { CreateActionDtoSchema } from '../../actions/dto/create-action.dto';

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
    type: [CreateActionDtoSchema],
    description: 'Actions performed during the inspection',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateActionDtoSchema)
  actions?: CreateActionDtoSchema[];
}
