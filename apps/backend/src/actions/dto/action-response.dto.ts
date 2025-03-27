import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiSchema,
  getSchemaPath,
} from '@nestjs/swagger';

export enum ActionType {
  FEEDING = 'FEEDING',
  TREATMENT = 'TREATMENT',
  FRAME = 'FRAME',
  OTHER = 'OTHER',
}
// DTOs for specific action details
@ApiSchema({ name: 'FeedingActionDetailsDto' })
export class FeedingActionDetailsDto {
  @ApiProperty({
    type: String,
    description: 'Type of feed (Sugar Syrup, Honey, Pollen Sub, Candy)',
  })
  @IsString()
  @Expose()
  feedType: string;

  @IsNumber()
  @Expose()
  @ApiProperty({ type: Number, description: 'Amount of feed' })
  amount: number;

  @ApiProperty({
    type: String,
    description: 'Unit of measurement (liters, quarts, gallons, kg, lb)',
  })
  @IsString()
  @Expose()
  unit: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Concentration of feed (1:1, 2:1, etc.)',
  })
  @IsOptional()
  @IsString()
  @Expose()
  concentration?: string;

  @ApiProperty({
    enum: [ActionType.FEEDING],
    description: 'Type of action',
  })
  @IsString()
  @Expose()
  type: ActionType.FEEDING;
}

@ApiSchema({ name: 'OtherActionDetails' })
export class OtherActionDetailsDto {
  @ApiProperty({
    enum: [ActionType.OTHER],
    description: 'Type of action',
  })
  @IsString()
  @Expose()
  type: ActionType.OTHER;
}

@ApiSchema({ name: 'TreatmentActionDetailsDto' })
export class TreatmentActionDetailsDto {
  @ApiProperty({
    type: String,
    description: 'Treatment product name',
  })
  @IsString()
  @Expose()
  product: string;

  @ApiProperty({
    type: Number,
    description: 'Treatment quantity',
  })
  @IsNumber()
  @Expose()
  quantity: number;

  @ApiProperty({
    type: String,
    description: 'Unit of measurement',
  })
  @IsString()
  @Expose()
  unit: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Treatment duration',
  })
  @IsOptional()
  @IsString()
  @Expose()
  duration?: string;

  @ApiProperty({
    enum: [ActionType.TREATMENT],
    description: 'Type of action',
  })
  @IsString()
  @Expose()
  type: ActionType.TREATMENT;
}

@ApiSchema({ name: 'FrameActionDetailsDto' })
export class FrameActionDetailsDto {
  @ApiProperty({
    type: Number,
    description: 'Quantity of frames',
  })
  @IsNumber()
  @Expose()
  quantity: number;

  @ApiPropertyOptional({
    enum: [ActionType.FRAME],
  })
  @Expose()
  type: ActionType.FRAME;
}
// Base class for all actions
export class BaseActionDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Additional notes about the action',
  })
  @IsOptional()
  @IsString()
  @Expose()
  notes?: string;
}

// Feeding action
@ApiSchema({ name: 'FeedingActionDto' })
export class FeedingActionDto extends BaseActionDto {
  @ApiProperty({
    enum: [ActionType.FEEDING],
    description: 'Type of action performed',
  })
  @IsEnum(ActionType)
  @Expose()
  type: ActionType.FEEDING;

  @ApiProperty({
    description: 'Feeding details',
  })
  @ValidateNested()
  @Expose()
  @Type(() => FeedingActionDetailsDto)
  details: FeedingActionDetailsDto;
}

// Treatment action
@ApiSchema({ name: 'TreatmentActionDto' })
export class TreatmentActionDto extends BaseActionDto {
  @ApiProperty({
    enum: [ActionType.TREATMENT],
    description: 'Type of action performed',
  })
  @IsEnum(ActionType)
  @Expose()
  type: ActionType.TREATMENT;

  @ApiProperty({
    description: 'Treatment details',
  })
  @ValidateNested()
  @Expose()
  @Type(() => TreatmentActionDetailsDto)
  details: TreatmentActionDetailsDto;
}

// Frame action
@ApiSchema({ name: 'FrameActionDto' })
export class FrameActionDto extends BaseActionDto {
  @ApiProperty({
    enum: [ActionType.FRAME],
    description: 'Type of action performed',
  })
  @IsEnum(ActionType)
  @Expose()
  type: ActionType.FRAME;

  @ApiProperty({
    description: 'Frame details',
  })
  @ValidateNested()
  @Expose()
  @Type(() => FrameActionDetailsDto)
  details: FrameActionDetailsDto;
}

// Frame action
@ApiSchema({ name: 'FrameActionDto' })
export class OtherActionDto extends BaseActionDto {
  @ApiProperty({
    enum: [ActionType.OTHER],
    description: 'Type of action performed',
  })
  @IsEnum(ActionType)
  @Expose()
  type: ActionType.OTHER;
}

// The main ActionDto is now a union type
export type ActionDto =
  | FeedingActionDto
  | TreatmentActionDto
  | FrameActionDto
  | OtherActionDto;

// Helper to define the API schema for the union type
@ApiSchema({ name: 'ActionDto' })
export class ActionDtoSchema implements BaseActionDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'Unique ID of the action',
  })
  @IsString()
  @Expose()
  id: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'ID of the inspection this action belongs to',
  })
  @IsString()
  @Expose()
  inspectionId: string;

  @ApiProperty({
    enum: ActionType,
    description: 'Type of action performed',
  })
  type: ActionType;

  @ApiPropertyOptional({
    type: String,
    description: 'Additional notes about the action',
  })
  notes?: string;

  @ApiProperty({
    description: 'Specific details for the action',
    oneOf: [
      { $ref: getSchemaPath(FeedingActionDetailsDto) },
      { $ref: getSchemaPath(TreatmentActionDetailsDto) },
      { $ref: getSchemaPath(FrameActionDetailsDto) },
    ],
    discriminator: {
      propertyName: 'type',
      mapping: {
        [ActionType.FEEDING]: getSchemaPath(FeedingActionDetailsDto),
        [ActionType.TREATMENT]: getSchemaPath(TreatmentActionDetailsDto),
        [ActionType.FRAME]: getSchemaPath(FrameActionDetailsDto),
      },
    },
  })
  details:
    | FeedingActionDetailsDto
    | TreatmentActionDetailsDto
    | FrameActionDetailsDto
    | OtherActionDetailsDto;
}
