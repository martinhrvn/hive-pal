// auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import {
  Register,
  AuthResponse,
  User,
  ForgotPassword,
  ResetPassword,
  SuccessResponse,
} from 'shared-schemas';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RequestWithUser } from './interface/request-with-user.interface';
import { CustomLoggerService } from '../logger/logger.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private logger: CustomLoggerService,
  ) {
    this.logger.setContext('AuthController');
  }

  @Post('register')
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async register(@Body() registerDto: Register) {
    this.logger.log(`Registering new user with email: ${registerDto.email}`);
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.name,
    );
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  login(@Request() req: RequestWithUser): AuthResponse {
    this.logger.log(`User ${req.user.email} (ID: ${req.user.id}) logged in`);
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: RequestWithUser): Promise<User> {
    this.logger.log(`Getting profile for user ID: ${req.user.id}`);
    return this.authService.getProfile(req.user.id);
  }

  @Post('forgot-password')
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent if user exists',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPassword,
  ): Promise<SuccessResponse> {
    this.logger.log(
      `Password reset requested for email: ${forgotPasswordDto.email}`,
    );
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPassword,
  ): Promise<SuccessResponse> {
    this.logger.log(
      `Password reset attempted with token: ${resetPasswordDto.token.substring(0, 8)}...`,
    );
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
  }
}
