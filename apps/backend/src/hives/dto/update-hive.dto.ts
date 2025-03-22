import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsEnum } from 'class-validator';
import { HiveStatusEnum } from './hive-status.enum';

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
    type: String,
  })
  @IsOptional()
  @IsString()
  installationDate?: string;

  @ApiProperty({
    description: 'Current status of the hive',
    required: false,
    enum: HiveStatusEnum,
    example: HiveStatusEnum.ACTIVE, // Assuming HiveStatus.Active exists
  })
  @IsOptional()
  @IsEnum(HiveStatusEnum)
  status?: HiveStatusEnum;
}
