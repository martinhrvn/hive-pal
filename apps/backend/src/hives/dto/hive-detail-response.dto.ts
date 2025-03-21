import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { HiveStatusEnum } from './hive-status.enum';
import { BoxResponseDto } from './box-response.dto';
import { QueenResponseDto } from '../../queens/dto/queen-response.dto';
import { InspectionScoreDto } from '../../inspections/dto/inspection-score.dto';

export class HiveDetailResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the hive',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Name of the hive',
    example: 'Hive #1',
    type: String,
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Status of the hive',
    example: 'ACTIVE',
    enum: HiveStatusEnum,
    enumName: 'HiveStatusEnum',
  })
  @IsEnum(HiveStatusEnum)
  @Expose()
  status: HiveStatusEnum;

  @ApiProperty({
    description: 'ID of the apiary this hive belongs to',
    example: '123e4567-e89b-12d3-a456-426614174001',
    type: String,
    required: false,
    nullable: true,
  })
  @Expose()
  apiaryId: string | null;

  @ApiProperty({
    description: 'Additional notes about the hive',
    example: 'Strong colony with good honey production',
    type: String,
    required: false,
    nullable: true,
  })
  @Expose()
  notes: string | null;

  @ApiProperty({
    description: 'Date when the hive was installed',
    example: '2023-04-15T12:00:00Z',
    type: String,
    nullable: true,
  })
  @Expose()
  installationDate: string | null;

  @ApiProperty({
    description: 'Date of the most recent inspection',
    example: '2023-05-20T14:30:00Z',
    type: String,
    required: false,
    nullable: true,
  })
  @Expose()
  lastInspectionDate: string | null;

  @ApiProperty({
    description: 'Boxes in the hive, ordered by position from bottom to top',
    type: BoxResponseDto,
    isArray: true,
  })
  @Expose()
  @Type(() => BoxResponseDto)
  boxes: BoxResponseDto[];

  @ApiProperty({
    description: 'The current active queen in the hive',
    type: () => QueenResponseDto,
    required: false,
    nullable: true,
  })
  @Expose()
  @Type(() => QueenResponseDto)
  activeQueen: QueenResponseDto | null;

  @ApiProperty({
    description: 'Hive score',
    type: () => InspectionScoreDto,
  })
  @Expose()
  @Type(() => InspectionScoreDto)
  hiveScore: InspectionScoreDto;
}
