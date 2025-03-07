import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BoxTypeDto {
  BROOD = 'BROOD',
  HONEY = 'HONEY',
  FEEDER = 'FEEDER',
}

export class BoxDto {
  @ApiProperty({
    description: 'Optional box ID (will be created if not provided)',
    required: false,
  })
  @IsUUID(4)
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Position of the box from bottom to top (0-based)',
    example: 0,
  })
  @IsInt()
  @Min(0)
  position: number;

  @ApiProperty({
    description: 'Number of frames in this box',
    example: 10,
  })
  @IsInt()
  @Min(1)
  frameCount: number;

  @ApiProperty({
    description: 'Whether there is a queen excluder above this box',
    example: false,
  })
  @IsBoolean()
  hasExcluder: boolean;

  @ApiProperty({
    description: 'Type of box',
    enum: BoxTypeDto,
    example: BoxTypeDto.BROOD,
  })
  @IsEnum(BoxTypeDto)
  type: BoxTypeDto;

  @ApiProperty({
    description: 'Maximum number of frames the box can hold',
    example: 10,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxFrameCount?: number;
}

export class UpdateHiveBoxesDto {
  @ApiProperty({
    description: 'List of boxes for the hive (will replace existing boxes)',
    type: [BoxDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BoxDto)
  boxes: BoxDto[];
}
