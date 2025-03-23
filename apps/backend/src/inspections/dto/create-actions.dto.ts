import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export enum ActionType {
  FEEDING = 'FEEDING',
  TREATMENT = 'TREATMENT',
  FRAME = 'FRAME',
  OTHER = 'OTHER',
}

export class FeedingActionDto {
  @ApiProperty({
    description: 'Type of feed (Sugar Syrup, Honey, Pollen Sub, Candy)',
  })
  @IsString()
  @IsNotEmpty()
  feedType: string;

  @ApiProperty({ description: 'Amount of feed' })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Unit of measurement (liters, quarts, gallons, kg, lb)',
  })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiPropertyOptional({
    description: 'Concentration of feed (1:1, 2:1, etc.)',
  })
  @IsString()
  @IsOptional()
  concentration?: string;
}

export class TreatmentActionDto {
  @ApiProperty({
    description: 'Treatment product name (Apivar, Formic Pro, etc.)',
  })
  @IsString()
  @IsNotEmpty()
  product: string;

  @ApiProperty({ description: 'Quantity of treatment' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Unit of measurement (strips, pads, grams, ml)' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiPropertyOptional({
    description: 'Duration of treatment (7 days, 14 days, etc.)',
  })
  @IsString()
  @IsOptional()
  duration?: string;
}

export class FrameActionDto {
  @ApiProperty({
    description: 'Number of frames added (positive) or removed (negative)',
  })
  @IsNumber()
  quantity: number;
}

export class CreateActionDto {
  @ApiProperty({ enum: ActionType, description: 'Type of action performed' })
  @IsEnum(ActionType)
  type: ActionType;

  @ApiPropertyOptional({ description: 'Additional notes about the action' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Feeding details', type: FeedingActionDto })
  @ValidateNested()
  @Type(() => FeedingActionDto)
  @ValidateIf((o: CreateActionDto) => o.type === ActionType.FEEDING)
  @IsNotEmpty({
    message: 'Feeding details are required for FEEDING action type',
  })
  feedingAction?: FeedingActionDto;

  @ApiProperty({ description: 'Treatment details', type: TreatmentActionDto })
  @ValidateNested()
  @Type(() => TreatmentActionDto)
  @ValidateIf((o: CreateActionDto) => o.type === ActionType.TREATMENT)
  @IsNotEmpty({
    message: 'Treatment details are required for TREATMENT action type',
  })
  treatmentAction?: TreatmentActionDto;

  @ApiProperty({ description: 'Frame details', type: FrameActionDto })
  @ValidateNested()
  @Type(() => FrameActionDto)
  @ValidateIf((o: CreateActionDto) => o.type === ActionType.FRAME)
  @IsNotEmpty({ message: 'Frame details are required for FRAME action type' })
  frameAction?: FrameActionDto;
}
