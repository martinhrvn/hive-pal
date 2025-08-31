import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserPreferencesDto {
  @ApiProperty({ required: false, description: 'User language preference' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ required: false, description: 'Theme preference (light/dark/system)' })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiProperty({ required: false, description: 'Date format preference' })
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @ApiProperty({ required: false, description: 'Units preference (metric/imperial)' })
  @IsOptional()
  @IsString()
  units?: string;

  @ApiProperty({ required: false, description: 'Email notifications enabled' })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiProperty({ required: false, description: 'Push notifications enabled' })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @ApiProperty({ required: false, description: 'Inspection reminders enabled' })
  @IsOptional()
  @IsBoolean()
  inspectionReminders?: boolean;

  @ApiProperty({ required: false, description: 'Harvest reminders enabled' })
  @IsOptional()
  @IsBoolean()
  harvestReminders?: boolean;
}

export class UpdateUserInfoDto {
  @ApiProperty({ required: false, description: 'User name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, description: 'User email' })
  @IsOptional()
  @IsString()
  email?: string;
}