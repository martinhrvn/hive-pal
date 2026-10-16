import { isValidMcpResource, loadMcpConfig } from './mcp-config';

describe('loadMcpConfig', () => {
  it('serves MCP under /api/mcp on the auth base URL', () => {
    const config = loadMcpConfig({ BETTER_AUTH_URL: 'https://hivepal.app/' });
    expect(config).toEqual({
      enabled: true,
      resource: 'https://hivepal.app/api/mcp',
    });
  });

  it('allows plain http only on loopback hosts', () => {
    expect(
      loadMcpConfig({ BETTER_AUTH_URL: 'http://localhost:3000' }).enabled,
    ).toBe(true);
    expect(
      loadMcpConfig({ BETTER_AUTH_URL: 'http://192.168.1.20:3000' }).enabled,
    ).toBe(false);
  });

  it('can be switched off', () => {
    expect(
      loadMcpConfig({
        BETTER_AUTH_URL: 'https://hivepal.app',
        MCP_ENABLED: 'false',
      }).enabled,
    ).toBe(false);
  });
});

describe('isValidMcpResource', () => {
  it('rejects malformed URLs', () => {
    expect(isValidMcpResource('not a url')).toBe(false);
  });

  it('accepts the IPv4 loopback address', () => {
    expect(isValidMcpResource('http://127.0.0.1:3000/api/mcp')).toBe(true);
  });
});
