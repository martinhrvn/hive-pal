import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class EnvController {
  @Get('env.js')
  getEnv(@Res() res: Response) {
    const config = {
      VITE_SENTRY_DSN: process.env.VITE_SENTRY_DSN || '',
      VITE_SENTRY_ENVIRONMENT: process.env.VITE_SENTRY_ENVIRONMENT || '',
    };
    res.type('application/javascript');
    res.send(`window.ENV = ${JSON.stringify(config)};`);
  }
}
