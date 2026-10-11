import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { isLocalLoginDisabled, loadOidcConfig } from './auth/oidc-config';

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
  // SSO settings derived from the backend's OIDC_* env vars (never secrets).
  VITE_OIDC_ENABLED: string;
  VITE_OIDC_PROVIDER_ID: string;
  VITE_OIDC_BUTTON_LABEL: string;
  VITE_OIDC_ALLOW_SIGNUP: string;
  VITE_LOCAL_LOGIN_ENABLED: string;
}

export function buildEnvConfig(
  env: NodeJS.ProcessEnv = process.env,
): EnvConfig {
  const oidc = loadOidcConfig(env);
  return {
    VITE_SENTRY_DSN: env.VITE_SENTRY_DSN || '',
    VITE_SENTRY_ENVIRONMENT: env.VITE_SENTRY_ENVIRONMENT || '',
    VITE_FARO_URL: env.VITE_FARO_URL || '',
    VITE_FARO_ENVIRONMENT: env.VITE_FARO_ENVIRONMENT || '',
    VITE_OIDC_ENABLED: String(oidc.enabled),
    VITE_OIDC_PROVIDER_ID: oidc.enabled ? oidc.providerId : '',
    VITE_OIDC_BUTTON_LABEL: oidc.enabled ? oidc.buttonLabel : '',
    VITE_OIDC_ALLOW_SIGNUP: String(oidc.enabled && oidc.allowSignup),
    VITE_LOCAL_LOGIN_ENABLED: String(!isLocalLoginDisabled(env, oidc)),
  };
}
