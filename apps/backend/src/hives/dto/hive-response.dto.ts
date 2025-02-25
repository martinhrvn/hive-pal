import { ApiProperty } from '@nestjs/swagger';

export class HiveResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the hive',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the hive',
    example: 'Hive #1',
  })
  name: string;

  @ApiProperty({
    description: 'ID of the apiary this hive belongs to',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
    nullable: true,
  })
  apiaryId: string | null;

  @ApiProperty({
    description: 'Additional notes about the hive',
    example: 'Strong colony with good honey production',
    required: false,
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Date when the hive was installed',
    example: '2023-04-15T12:00:00Z',
  })
  installationDate: string;

  @ApiProperty({
    description: 'Date of the most recent inspection',
    example: '2023-05-20T14:30:00Z',
    required: false,
    nullable: true,
  })
  lastInspectionDate: Date | null;
}
