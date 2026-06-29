import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller()
export class EnvController {
  @Get('env.js')
  getEnv(@Res() res: Response) {
    const config = buildEnvConfig();
    res.type('application/javascript');
    res.send(`window.ENV = ${JSON.stringify(config)};`);
  }
}

export interface EnvConfig {
  VITE_SENTRY_DSN: string;
  VITE_SENTRY_ENVIRONMENT: string;
  VITE_FARO_URL: string;
  VITE_FARO_ENVIRONMENT: string;
}

export function buildEnvConfig(
  env: NodeJS.ProcessEnv = process.env,
): EnvConfig {
  return {
    VITE_SENTRY_DSN: env.VITE_SENTRY_DSN || '',
    VITE_SENTRY_ENVIRONMENT: env.VITE_SENTRY_ENVIRONMENT || '',
    VITE_FARO_URL: env.VITE_FARO_URL || '',
    VITE_FARO_ENVIRONMENT: env.VITE_FARO_ENVIRONMENT || '',
  };
}
