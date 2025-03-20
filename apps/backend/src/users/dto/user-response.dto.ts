import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Expose } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty({
    type: String,
    description: 'Unique identifier for the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    type: String,
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    type: String,
    description: 'Name of the user',
    example: 'John Doe',
    required: false,
    nullable: true
  })
  @Expose()
  name?: string | null;

  @ApiProperty({
    description: 'Role of the user',
    enum: Role,
    example: 'USER',
  })
  @Expose()
  role: Role;

  @ApiProperty({
    type: Boolean,
    description: 'Whether the user needs to change their password',
    example: false,
  })
  @Expose()
  passwordChangeRequired: boolean;

  @ApiProperty({
    type: Date,
    format: 'date-time',
    description: 'User creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    type: Date,
    format: 'date-time',
    description: 'Last update date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;
}
