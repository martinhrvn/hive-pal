import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ActionType } from '../../inspections/dto/create-actions.dto';
import { Type } from 'class-transformer';

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

// Discriminated Union DTO for Action Details
export class FeedingActionDto extends ActionDto {
  @ValidateNested()
  @Type(() => FeedingActionDetailsDto)
  details: {
    type: ActionType.FEEDING;
    details: FeedingActionDetailsDto;
  };
}

export class TreatmentActionDto extends ActionDto {
  @ValidateNested()
  @Type(() => TreatmentActionDetailsDto)
  details: {
    type: ActionType.TREATMENT;
    details: TreatmentActionDetailsDto;
  };
}

export class FrameActionDto extends ActionDto {
  details: {
    type: ActionType.FRAME;
    details: null;
  };
}

// Union type for all possible Action DTOs
export type ActionDtoUnion =
  | FeedingActionDto
  | TreatmentActionDto
  | FrameActionDto;
