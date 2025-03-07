import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BoxTypeDto } from './update-hive-boxes.dto';

export class BoxResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the box',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Position of the box from bottom to top (0-based)',
    example: 0,
  })
  @Expose()
  position: number;

  @ApiProperty({
    description: 'Number of frames in this box',
    example: 8,
  })
  @Expose()
  frameCount: number;

  @ApiProperty({
    description: 'Maximum number of frames the box can hold',
    example: 10,
    required: false,
    nullable: true,
  })
  @Expose()
  maxFrameCount: number | null;

  @ApiProperty({
    description: 'Whether there is a queen excluder above this box',
    example: false,
  })
  @Expose()
  hasExcluder: boolean;

  @ApiProperty({
    description: 'Type of box',
    enum: BoxTypeDto,
    example: BoxTypeDto.BROOD,
  })
  @Expose()
  type: BoxTypeDto;
}
