import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ActionType } from '../../inspections/dto/create-actions.dto';
import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ActionDto {
  @IsString()
  id: string;

  @IsString()
  inspectionId: string;

  @IsEnum(ActionType)
  type: ActionType;

  @IsOptional()
  @IsString()
  notes?: string;
}

// DTOs for specific action details
export class FeedingActionDetailsDto {
  @IsString()
  feedType: string;

  @IsNumber()
  amount: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsString()
  concentration?: string;
}

export class TreatmentActionDetailsDto {
  @IsString()
  product: string;

  @IsNumber()
  quantity: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsString()
  duration?: string;
}

export class FrameActionDetailsDto {
  @IsNumber()
  quantity: number;
}

// Discriminated Union DTO for Action Details
export class FeedingActionDto extends ActionDto {
  @Expose()
  type: ActionType.FEEDING;
  @ValidateNested()
  @Type(() => FeedingActionDetailsDto)
  @Expose()
  details: FeedingActionDetailsDto;
}

export class TreatmentActionDto extends ActionDto {
  @Expose()
  type: ActionType.TREATMENT;
  @ValidateNested()
  @ApiProperty({ type: FeedingActionDetailsDto })
  @Type(() => TreatmentActionDetailsDto)
  details: TreatmentActionDetailsDto;
}

export class FrameActionDto extends ActionDto {
  @Expose()
  type: ActionType.FRAME;
  @ValidateNested()
  details: FrameActionDetailsDto;
}

export class OtherActionDto extends ActionDto {
  @Expose()
  type: ActionType.OTHER;
}

// Union type for all possible Action DTOs
export type ActionDtoUnion =
  | FeedingActionDto
  | TreatmentActionDto
  | FrameActionDto
  | OtherActionDto;
