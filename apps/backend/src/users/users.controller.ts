import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UnauthorizedException,
  NotFoundException,
  Req,
  SerializeOptions,
} from '@nestjs/common';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  Role,
} from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { ResetPasswordDto, ChangePasswordDto, UserResponseDto } from './dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { RequestWithUser } from '../auth/interface/request-with-user.interface';
import { CustomLoggerService } from '../logger/logger.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('UsersController');
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    type: [UserResponseDto],
  })
  @SerializeOptions({ type: UserResponseDto })
  async findAll(): Promise<UserResponseDto[]> {
    this.logger.log('Admin requesting list of all users');
    return this.usersService.findAll();
  }

  @Post(':id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reset a user's password (admin only)" })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    type: UserResponseDto,
  })
  @SerializeOptions({ type: UserResponseDto })
  async resetPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: RequestWithUser,
  ): Promise<UserResponseDto> {
    this.logger.log(
      `Admin user ${req.user.id} resetting password for user ${id}`,
    );
    return this.usersService.resetPassword(id, resetPasswordDto.tempPassword);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change own password' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: UserResponseDto,
  })
  @SerializeOptions({ type: UserResponseDto })
  async changePassword(
    @Req() req: RequestWithUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<UserResponseDto> {
    this.logger.log(`User ${req.user.id} changing their password`);

    const user = await this.usersService.findById(req.user.id);

    if (!user) {
      this.logger.warn(
        `User ${req.user.id} not found when trying to change password`,
      );
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      this.logger.warn(
        `User ${req.user.id} provided invalid current password when changing password`,
      );
      throw new UnauthorizedException('Current password is incorrect');
    }

    this.logger.log(
      `Password change verified for user ${req.user.id}, updating password`,
    );
    return this.usersService.changePassword(
      req.user.id,
      changePasswordDto.newPassword,
    );
  }
}
