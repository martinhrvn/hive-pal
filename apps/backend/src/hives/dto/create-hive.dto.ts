import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { HiveStatusEnum } from './hive-status.enum';

export class CreateHiveDto {
  @ApiProperty({ description: 'The name of the hive', example: 'Hive #1' })
  @IsString()
  name: string;

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
    enum: HiveStatusEnum,
    example: HiveStatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsEnum(HiveStatusEnum)
  status?: HiveStatusEnum;
}
