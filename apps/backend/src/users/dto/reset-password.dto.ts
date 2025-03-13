import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Temporary password to be set for the user',
    example: 'Temp123!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  tempPassword: string;
}
