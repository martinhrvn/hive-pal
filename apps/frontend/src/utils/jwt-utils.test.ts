/**
 * Integration tests for jwt-utils using safeJsonParse
 */
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type MockInstance,
} from 'vitest';
import { decodeJwt, isTokenExpired } from './jwt-utils';

/**
 * Helper function to create a mock JWT token for testing
 * @param payload - The JWT payload object (can be any object, not validated here)
 * @returns A mock JWT token string in the format header.payload.signature
 */
function createMockJwt(payload: unknown): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = btoa(
    typeof payload === 'string' ? payload : JSON.stringify(payload),
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    // Security fix: Use bounded quantifier /={1,3}$/ instead of /=+$/ to prevent ReDoS.
    // Base64 padding is always 0-3 '=' characters maximum, so bounded quantifier is safe.
    .replace(/={1,3}$/, '');
  const signature = 'fake-signature';
  return `${header}.${encodedPayload}.${signature}`;
}

describe('jwt-utils integration with safeJsonParse', () => {
  let consoleSpy: {
    error: MockInstance;
    warn: MockInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  describe('decodeJwt', () => {
    it('should decode a valid JWT token', () => {
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sub: 'user123',
        email: 'user@example.com',
      };
      const token = createMockJwt(payload);

      const result = decodeJwt(token);

      expect(result).toEqual(payload);
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it('should return null for token with invalid format', () => {
      const result = decodeJwt('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null and log error for token with malformed JSON payload', () => {
      const token = createMockJwt('invalid json');

      const result = decodeJwt(token);

      expect(result).toBeNull();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse JSON for "JWT payload"'),
        expect.any(Object),
      );
    });

    it('should return null and log warning for token with invalid schema', () => {
      // Missing required 'email' field
      const invalidPayload = {
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sub: 'user123',
      };
      const token = createMockJwt(invalidPayload);

      const result = decodeJwt(token);

      expect(result).toBeNull();
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Schema validation failed for "JWT payload"'),
        expect.any(Object),
      );
    });

    it('should return null for token with non-email in email field', () => {
      const invalidPayload = {
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sub: 'user123',
        email: 'not-an-email',
      };
      const token = createMockJwt(invalidPayload);

      const result = decodeJwt(token);

      expect(result).toBeNull();
      expect(consoleSpy.warn).toHaveBeenCalled();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 3600, // expires in 1 hour
        iat: Math.floor(Date.now() / 1000),
        sub: 'user123',
        email: 'user@example.com',
      };
      const token = createMockJwt(payload);

      const result = isTokenExpired(token);

      expect(result).toBe(false);
    });

    it('should return true for expired token', () => {
      const payload = {
        exp: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200,
        sub: 'user123',
        email: 'user@example.com',
      };
      const token = createMockJwt(payload);

      const result = isTokenExpired(token);

      expect(result).toBe(true);
    });

    it('should return true for invalid token', () => {
      const result = isTokenExpired('invalid-token');

      expect(result).toBe(true);
    });

    it('should return true for token without exp field', () => {
      const payload = {
        iat: Math.floor(Date.now() / 1000),
        sub: 'user123',
        email: 'user@example.com',
      };
      const token = createMockJwt(payload);

      const result = isTokenExpired(token);

      expect(result).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty payload gracefully', () => {
      const token = createMockJwt('');

      const result = decodeJwt(token);

      expect(result).toBeNull();
    });

    it('should handle token with special characters in email', () => {
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sub: 'user123',
        email: 'user+test@example.com',
      };
      const token = createMockJwt(payload);

      const result = decodeJwt(token);

      expect(result?.email).toBe('user+test@example.com');
    });
  });
});
