import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class EnvController {
  @Get('env.js')
  getEnv(@Res() res: Response) {
    const config = {
      VITE_SENTRY_DSN: process.env.VITE_SENTRY_DSN || '',
      VITE_SENTRY_ENVIRONMENT: process.env.VITE_SENTRY_ENVIRONMENT || '',
    const config = buildEnvConfig();
    res.type('application/javascript');
    res.send(`window.ENV = ${JSON.stringify(config)};`);
  }
}

export interface EnvConfig {
  VITE_SENTRY_DSN: string;
  VITE_SENTRY_ENVIRONMENT: string;
}

export function buildEnvConfig(env: NodeJS.ProcessEnv = process.env): EnvConfig {
  return {
    VITE_SENTRY_DSN: env.VITE_SENTRY_DSN || '',
    VITE_SENTRY_ENVIRONMENT: env.VITE_SENTRY_ENVIRONMENT || '',
  };
}
