import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BoxTypeDto } from './update-hive-boxes.dto';

export class BoxResponseDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Unique identifier of the box',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Position of the box from bottom to top (0-based)',
    example: 0,
    type: Number,
  })
  @Expose()
  position: number;

  @ApiProperty({
    type: Number,
    description: 'Number of frames in this box',
    example: 8
  })
  @Expose()
  frameCount: number;

  @ApiProperty({
    type: Number,
    description: 'Maximum number of frames the box can hold',
    example: 10,
    required: false,
    nullable: true
  })
  @Expose()
  maxFrameCount: number | null;

  @ApiProperty({
    type: Boolean,
    description: 'Whether there is a queen excluder above this box',
    example: false
  })
  @Expose()
  hasExcluder: boolean;

  @ApiProperty({
    enum: BoxTypeDto,
    enumName: 'BoxTypeDto',
    description: 'Type of box',
    example: BoxTypeDto.BROOD
  })
  @Expose()
  type: BoxTypeDto;
}
