import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ActionType } from '../../inspections/dto/create-actions.dto';
import { Expose, Type } from 'class-transformer';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiSchema,
  getSchemaPath,
} from '@nestjs/swagger';

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

export class ActionDto {
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
  @IsEnum(ActionType)
  @Expose()
  type: ActionType;

  @IsOptional()
  @IsString()
  @Expose()
  notes?: string;

  @ApiProperty({
    name: 'details',
    description: 'Specific details for the action',
    oneOf: [
      { $ref: getSchemaPath(FeedingActionDetailsDto) },
      { $ref: '#/components/schemas/TreatmentActionDetailsDto' },
      { $ref: '#/components/schemas/FrameActionDetailsDto' },
    ],
  })
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => ActionDto, {
    discriminator: {
      property: 'type',
      subTypes: [
        { value: FeedingActionDetailsDto, name: ActionType.FEEDING },
        { value: TreatmentActionDetailsDto, name: ActionType.TREATMENT },
        { value: FrameActionDetailsDto, name: ActionType.FRAME },
      ],
    },
  })
  details?:
    | FeedingActionDetailsDto
    | TreatmentActionDetailsDto
    | FrameActionDetailsDto
    | null;
}
