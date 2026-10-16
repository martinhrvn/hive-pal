import { All, Controller, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { requireMcpAuth } from '@better-auth/mcp';
import { auth } from '../auth/better-auth';
import { MCP_READ_SCOPE, loadMcpConfig } from '../auth/mcp-config';
import { McpServerFactory } from './mcp-server.factory';
import { parseScopes } from './mcp-context';
import { sendWebResponse, toWebRequest } from './web-request';

const jsonRpcError = (status: number, message: string, headers = {}) =>
  new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32000, message },
      id: null,
    }),
    { status, headers: { 'Content-Type': 'application/json', ...headers } },
  );

/**
 * MCP endpoint (Streamable HTTP, stateless, JSON responses) at /api/mcp.
 *
 * Authenticated by OAuth access tokens that better-auth's mcp() plugin issues,
 * not by the session cookie: requireMcpAuth verifies the bearer JWT against
 * the JWKS, and answers unauthenticated requests with the `WWW-Authenticate`
 * challenge MCP clients use to start the OAuth flow.
 */
@ApiExcludeController()
@Controller('mcp')
export class McpController {
  private readonly config = loadMcpConfig();
  private readonly handle = requireMcpAuth(
    auth,
    (request, claims) => this.serve(request, claims),
    { resource: this.config.resource, requiredScopes: [MCP_READ_SCOPE] },
  );

  constructor(private readonly serverFactory: McpServerFactory) {}

  @All()
  async mcp(
    @Req() req: ExpressRequest,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    if (!this.config.enabled) {
      return sendWebResponse(res, jsonRpcError(404, 'MCP is not enabled'));
    }
    // Stateless server: no standalone SSE stream (GET) or sessions (DELETE).
    if (req.method !== 'POST') {
      return sendWebResponse(
        res,
        jsonRpcError(405, 'Method not allowed', { Allow: 'POST' }),
      );
    }
    await sendWebResponse(res, await this.handle(toWebRequest(req)));
  }

  private async serve(
    request: Request,
    claims: { sub?: string; scope?: unknown },
  ): Promise<Response> {
    if (!claims.sub) return jsonRpcError(401, 'Token has no subject');
    const server = this.serverFactory.create({
      userId: claims.sub,
      scopes: parseScopes(claims.scope),
    });
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    try {
      return await transport.handleRequest(request);
    } finally {
      await server.close();
    }
  }
}
