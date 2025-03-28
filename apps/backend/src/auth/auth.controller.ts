// auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  SerializeOptions,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { 
  loginSchema, 
  registerSchema, 
  authResponseSchema, 
  Login, 
  Register, 
  AuthResponse 
} from '@hive-pal/shared-schemas';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RequestWithUser } from './interface/request-with-user.interface';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { CustomLoggerService } from '../logger/logger.service';
import { ZodValidation } from '../common/decorators/zod-validation.decorator';

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
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @SerializeOptions({ type: AuthResponseDto })
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log(`Registering new user with email: ${registerDto.email}`);
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.name,
    );
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  @SerializeOptions({ type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  login(@Request() req: RequestWithUser) {
    this.logger.log(`User ${req.user.email} (ID: ${req.user.id}) logged in`);
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @SerializeOptions({ type: UserResponseDto })
  async getProfile(@Request() req: RequestWithUser): Promise<UserResponseDto> {
    this.logger.log(`Getting profile for user ID: ${req.user.id}`);
    return this.authService.getProfile(req.user.id);
  }
}
