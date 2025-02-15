import { ApiProperty } from '@nestjs/swagger';
import { BoxType } from '@prisma/client';

export class BoxDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;
  name: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  hiveId: string;

  @ApiProperty({
    example: 1,
    description: 'Order of the box in the hive, starting with 1',
  })
  position: number;

  @ApiProperty({
    example: 10,
    description: 'Number of frames in the box',
  })
  frameCount: number;

  @ApiProperty({
    example: 'true',
    description: 'Has a queen excluder',
  })
  hasQueenExcluder: boolean;

  @ApiProperty({
    example: 'SUPER',
    description: 'Type of the box',
  })
  type: BoxType;
}

export class CreateBoxDto {
  name: string;
  position: number;
  frameCount: number;
  hasQueenExcluder: boolean;
  type: BoxType;
}
