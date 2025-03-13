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
