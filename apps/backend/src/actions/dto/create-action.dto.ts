import {
  ApiProperty,
  ApiPropertyOptional,
  ApiSchema,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  ActionType,
  BaseActionDto,
  FeedingActionDetailsDto,
  FrameActionDetailsDto,
  OtherActionDetailsDto,
  TreatmentActionDetailsDto,
} from './action-response.dto';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Helper to define the API schema for the union type
@ApiSchema({ name: 'CreateActionDto' })
export class CreateActionDtoSchema implements BaseActionDto {
  @ApiProperty({
    enum: ActionType,
    description: 'Type of action performed',
  })
  @IsEnum(ActionType)
  type: ActionType;

  @ApiPropertyOptional({
    type: String,
    description: 'Additional notes about the action',
  })
  @IsString()
  @IsOptional()
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
  @Type(() => Object, {
    // This is the key part - dynamically determine the correct type based on the 'type' field
    discriminator: {
      property: 'type',
      subTypes: [
        { value: FeedingActionDetailsDto, name: ActionType.FEEDING },
        { value: TreatmentActionDetailsDto, name: ActionType.TREATMENT },
        { value: FrameActionDetailsDto, name: ActionType.FRAME },
        { value: OtherActionDetailsDto, name: ActionType.OTHER },
      ],
    },
  })
  @ValidateNested()
  details?:
    | FeedingActionDetailsDto
    | TreatmentActionDetailsDto
    | FrameActionDetailsDto
    | OtherActionDetailsDto;
}
