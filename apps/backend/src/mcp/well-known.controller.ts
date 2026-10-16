import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import {
  oauthProviderAuthServerMetadata,
  oauthProviderOpenIdConfigMetadata,
} from '@better-auth/oauth-provider';
import { auth } from '../auth/better-auth';
import {
  MCP_READ_SCOPE,
  MCP_WRITE_SCOPE,
  loadMcpConfig,
} from '../auth/mcp-config';
import { sendWebResponse, toWebRequest } from './web-request';

// MCP clients look these up at the origin root, outside the /api prefix. The
// issuer is <BETTER_AUTH_URL>/api/auth, so each document is also served with
// the issuer path appended (RFC 8414 §3.1).
const PROTECTED_RESOURCE = 'oauth-protected-resource';
const AUTH_SERVER = 'oauth-authorization-server';
const OPENID = 'openid-configuration';

export const WELL_KNOWN_PATHS = [
  PROTECTED_RESOURCE,
  `${PROTECTED_RESOURCE}/api/mcp`,
  AUTH_SERVER,
  `${AUTH_SERVER}/api/auth`,
  OPENID,
  `${OPENID}/api/auth`,
].map((path) => `.well-known/${path}`);

const authServerMetadata = oauthProviderAuthServerMetadata(auth);
const openIdMetadata = oauthProviderOpenIdConfigMetadata(auth);

@ApiExcludeController()
@Controller('.well-known')
export class WellKnownController {
  private readonly config = loadMcpConfig();

  /** RFC 9728 protected resource metadata for the MCP endpoint. */
  @Get([PROTECTED_RESOURCE, `${PROTECTED_RESOURCE}/api/mcp`])
  async protectedResource(@Res() res: ExpressResponse): Promise<void> {
    if (!this.config.enabled) {
      res.status(404).end();
      return;
    }
    const { baseURL } = await auth.$context;
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json({
      resource: this.config.resource,
      authorization_servers: [baseURL],
      bearer_methods_supported: ['header'],
      scopes_supported: [MCP_READ_SCOPE, MCP_WRITE_SCOPE],
      resource_name: 'Hive Pal',
    });
  }

  @Get([AUTH_SERVER, `${AUTH_SERVER}/api/auth`])
  async authorizationServer(
    @Req() req: ExpressRequest,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    if (!this.config.enabled) {
      res.status(404).end();
      return;
    }
    await sendWebResponse(res, await authServerMetadata(toWebRequest(req)));
  }

  @Get([OPENID, `${OPENID}/api/auth`])
  async openIdConfiguration(
    @Req() req: ExpressRequest,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    if (!this.config.enabled) {
      res.status(404).end();
      return;
    }
    await sendWebResponse(res, await openIdMetadata(toWebRequest(req)));
  }
}
