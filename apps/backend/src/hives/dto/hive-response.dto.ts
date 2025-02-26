import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { HiveStatus } from '@prisma/client';

export class HiveResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the hive',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Name of the hive',
    example: 'Hive #1',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Status of the hive',
    example: 'ACTIVE',
  })
  @Expose()
  status: HiveStatus;

  @ApiProperty({
    description: 'ID of the apiary this hive belongs to',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
    nullable: true,
  })
  @Expose()
  apiaryId: string | null;

  @ApiProperty({
    description: 'Additional notes about the hive',
    example: 'Strong colony with good honey production',
    required: false,
    nullable: true,
  })
  @Expose()
  notes: string | null;

  @ApiProperty({
    description: 'Date when the hive was installed',
    example: '2023-04-15T12:00:00Z',
    nullable: true,
  })
  @Expose()
  installationDate: string | null;

  @ApiProperty({
    description: 'Date of the most recent inspection',
    example: '2023-05-20T14:30:00Z',
    required: false,
    nullable: true,
  })
  @Expose()
  lastInspectionDate: string | null;
}
