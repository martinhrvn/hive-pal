import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsDate, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { HiveStatus } from '@prisma/client';

export class UpdateHiveDto {
  @ApiProperty({
    description: 'The name of the hive',
    example: 'Hive #1',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'The ID of the apiary this hive belongs to',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  apiaryId?: string;

  @ApiProperty({
    description: 'Additional notes about the hive',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Date when the hive was installed',
    required: false,
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  installationDate?: Date;

  @ApiProperty({
    description: 'Current status of the hive',
    required: false,
    enum: HiveStatus,
    example: HiveStatus.ACTIVE, // Assuming HiveStatus.Active exists
  })
  @IsOptional()
  @IsEnum(HiveStatus)
  status?: HiveStatus;
}
