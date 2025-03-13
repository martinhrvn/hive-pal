import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Name of the user',
    example: 'John Doe',
    required: false,
  })
  name?: string | null;

  @ApiProperty({
    description: 'Role of the user',
    enum: Role,
    example: 'USER',
  })
  role: Role;

  @ApiProperty({
    description: 'Whether the user needs to change their password',
    example: false,
  })
  passwordChangeRequired: boolean;

  @ApiProperty({
    description: 'User creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
