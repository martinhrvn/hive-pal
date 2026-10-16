// MCP (Model Context Protocol) server settings. Hive Pal acts as the OAuth
// authorization server for MCP clients (Claude, IDEs, …) through better-auth's
// `mcp()` plugin, and serves the MCP endpoint itself at <BETTER_AUTH_URL>/api/mcp.
//
//   MCP_ENABLED   set to "false" to turn the MCP endpoint and OAuth provider
//                 off (default: on whenever the resource URL is valid)
//
// MCP requires the resource URL to be https, except for loopback hosts used in
// development. A deployment served over plain http on a LAN host gets no MCP
// rather than failing to boot.

export const MCP_READ_SCOPE = 'hivepal:read';
export const MCP_WRITE_SCOPE = 'hivepal:write';

export const MCP_SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  MCP_READ_SCOPE,
  MCP_WRITE_SCOPE,
];

export interface McpConfig {
  enabled: boolean;
  /** Canonical protected-resource URL; access tokens are audience-bound to it. */
  resource: string;
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function isValidMcpResource(resource: string): boolean {
  try {
    const url = new URL(resource);
    return (
      url.protocol === 'https:' ||
      (url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname))
    );
  } catch {
    return false;
  }
}

export function loadMcpConfig(env: NodeJS.ProcessEnv = process.env): McpConfig {
  const baseUrl = (env.BETTER_AUTH_URL ?? 'http://localhost:3000').replace(
    /\/+$/,
    '',
  );
  const resource = `${baseUrl}/api/mcp`;
  const optedOut = env.MCP_ENABLED?.trim().toLowerCase() === 'false';
  return {
    enabled: !optedOut && isValidMcpResource(resource),
    resource,
  };
}

const isLoopbackHttpUri = (uri: unknown): boolean => {
  if (typeof uri !== 'string') return false;
  try {
    const url = new URL(uri);
    return url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
};

/**
 * Dynamic client registration defaults `application_type` to "web", which
 * only allows https redirect URIs. Local MCP clients (Claude Code, the MCP
 * Inspector, IDEs) register http://localhost callbacks without declaring
 * themselves native, so treat such a registration as a native app.
 */
export function nativeLoopbackRegistration(
  body: unknown,
): { application_type: 'native' } | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const { application_type, redirect_uris } = body as Record<string, unknown>;
  if (application_type !== undefined || !Array.isArray(redirect_uris)) {
    return undefined;
  }
  return redirect_uris.length > 0 && redirect_uris.every(isLoopbackHttpUri)
    ? { application_type: 'native' }
    : undefined;
}
