import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FeedbackType } from '@prisma/client';

export class CreateFeedbackDto {
  @ApiProperty({
    description: 'Email address for contact (optional)',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Type of feedback',
    enum: FeedbackType,
  })
  @IsEnum(FeedbackType)
  @IsNotEmpty()
  type: FeedbackType;

  @ApiProperty({
    description: 'Subject of the feedback',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Detailed message',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}