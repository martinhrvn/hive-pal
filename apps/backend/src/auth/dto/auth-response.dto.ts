import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

class UserDto {
  @ApiProperty({ description: 'User ID', example: '1' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
    required: false,
  })
  @Expose()
  name?: string;

  @ApiProperty({
    description: 'User role',
    example: 'USER',
    enum: ['USER', 'ADMIN'],
  })
  @Expose()
  role: string;

  @ApiProperty({
    description: 'Whether the user needs to change their password',
    example: false,
  })
  @Expose()
  passwordChangeRequired: boolean;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Expose()
  access_token: string;

  @ApiProperty({
    description: 'User information',
    type: UserDto,
  })
  @Expose()
  user: UserDto;
}
