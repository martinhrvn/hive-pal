import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ObservationResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  inspectionId: string;

  @ApiProperty()
  @Expose()
  type: string;

  @ApiProperty({ required: false })
  @Expose()
  numericValue: number | null;

  @ApiProperty({ required: false })
  @Expose()
  textValue: string | null;

  @ApiProperty({ required: false })
  @Expose()
  notes: string | null;
}
