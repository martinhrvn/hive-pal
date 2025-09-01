import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { FeedbackStatus } from '@prisma/client';

export class UpdateFeedbackStatusDto {
  @ApiProperty({
    description: 'New status for the feedback',
    enum: FeedbackStatus,
  })
  @IsEnum(FeedbackStatus)
  @IsNotEmpty()
  status: FeedbackStatus;
}