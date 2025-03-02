import { PartialType } from '@nestjs/swagger';
import { CreateInspectionDto } from './create-inspection.dto';
import { IsUUID } from 'class-validator';

export class UpdateInspectionDto extends PartialType(CreateInspectionDto) {
  @IsUUID()
  id: string;
}
