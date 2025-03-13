// auth.controller.ts
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RequestWithUser } from './interface/request-with-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; name?: string },
  ) {
    return this.authService.register(body.email, body.password, body.name);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: RequestWithUser) {
    return this.authService.login(req.user);
  }
}
