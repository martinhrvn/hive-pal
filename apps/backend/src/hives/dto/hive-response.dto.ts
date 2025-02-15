import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BoxDto } from './box.dto';
export class HiveResponseDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Expose()
  name: string;
  @Expose()
  apiaryId: string;
  notes: string;
  installationDate: string;
  lastInspectionDate: Date;
  boxes: BoxDto[];
}
