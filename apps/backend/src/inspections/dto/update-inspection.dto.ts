import { PartialType } from '@nestjs/swagger';
import { CreateInspectionDto } from './create-inspection.dto';
import { IsEnum, IsUUID } from 'class-validator';
import { InspectionStatus } from './inspection-status.enum';

export class UpdateInspectionDto extends PartialType(CreateInspectionDto) {
  @IsUUID()
  id: string;

  @IsEnum(InspectionStatus)
  status: InspectionStatus;
}
