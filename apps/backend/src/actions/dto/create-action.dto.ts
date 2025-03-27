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

// Helper to define the API schema for the union type
@ApiSchema({ name: 'CreateActionDto' })
export class CreateActionDtoSchema implements BaseActionDto {
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
