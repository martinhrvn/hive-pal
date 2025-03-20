import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { HiveStatusEnum } from './hive-status.enum';
import { QueenResponseDto } from '../../queens/dto/queen-response.dto';

export class HiveResponseDto {
  @ApiProperty({
    type: String,
    description: 'Unique identifier of the hive',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    type: String,
    description: 'Name of the hive',
    example: 'Hive #1',
  })
  @Expose()
  name: string;

  @ApiProperty({
    enum: HiveStatusEnum,
    enumName: 'HiveStatusEnum',
    description: 'Status of the hive',
    example: 'ACTIVE',
  })
  @IsEnum(HiveStatusEnum)
  @Expose()
  status: HiveStatusEnum;

  @ApiProperty({
    type: String,
    description: 'ID of the apiary this hive belongs to',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
    nullable: true,
  })
  @Expose()
  apiaryId: string | null;

  @ApiProperty({
    type: String,
    description: 'Additional notes about the hive',
    example: 'Strong colony with good honey production',
    required: false,
    nullable: true,
  })
  @Expose()
  notes: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Date when the hive was installed',
    example: '2023-04-15T12:00:00Z',
    nullable: true,
  })
  @Expose()
  installationDate: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Date of the most recent inspection',
    example: '2023-05-20T14:30:00Z',
    required: false,
    nullable: true,
  })
  @Expose()
  lastInspectionDate: string | null;

  @ApiProperty({
    description: 'The current active queen in the hive',
    type: QueenResponseDto,
    required: false,
    nullable: true,
  })
  @Expose()
  @Type(() => QueenResponseDto)
  activeQueen: QueenResponseDto | null;
}
