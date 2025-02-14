import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() credentials: { username: string; password: string }) {
    const token = await this.authService.validateUser(
      credentials.username,
      credentials.password,
    );
    if (!token) {
      throw new UnauthorizedException();
    }
    return { access_token: token };
  }
}
