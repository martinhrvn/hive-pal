import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { QueenStatus } from './queen-response.dto';

export class CreateQueenDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  hiveId?: string;

  @ApiProperty({
    required: false,
    description: 'Optional marking, usually number or similar',
  })
  @IsOptional()
  @IsString()
  marking: string | null;

  @ApiProperty({
    required: false,
    description: 'Optional color of the queen',
  })
  @IsOptional()
  @IsString()
  color: string | null;

  @ApiProperty()
  @Expose()
  @IsNumber()
  year: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  source?: string | null;

  @ApiProperty({ required: false })
  @IsEnum(QueenStatus)
  status: QueenStatus | null;

  @ApiProperty({ required: false })
  @Expose()
  @IsDateString()
  installedAt?: string | null;

  @ApiProperty({ required: false })
  @Expose()
  @IsDateString()
  @IsOptional()
  replacedAt?: string | null;
}
