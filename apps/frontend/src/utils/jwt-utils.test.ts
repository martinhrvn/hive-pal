/**
 * Integration tests for jwt-utils using safeJsonParse
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { decodeJwt, isTokenExpired } from './jwt-utils';

describe('jwt-utils integration with safeJsonParse', () => {
  let consoleSpy: { error: any; warn: any };

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
      // Create a valid JWT payload
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sub: 'user123',
        email: 'user@example.com',
      };

      // Manually encode a JWT (header.payload.signature)
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const encodedPayload = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const signature = 'fake-signature';
      const token = `${header}.${encodedPayload}.${signature}`;

      const result = decodeJwt(token);

      expect(result).toEqual(payload);
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it('should return null for token with invalid format', () => {
      const result = decodeJwt('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null and log error for token with malformed JSON payload', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const malformedPayload = btoa('invalid json')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const signature = 'fake-signature';
      const token = `${header}.${malformedPayload}.${signature}`;

      const result = decodeJwt(token);

      expect(result).toBeNull();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse JSON for "JWT payload"'),
        expect.any(Object)
      );
    });

    it('should return null and log warning for token with invalid schema', () => {
      // Missing required 'email' field
      const invalidPayload = {
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sub: 'user123',
      };

      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const encodedPayload = btoa(JSON.stringify(invalidPayload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const signature = 'fake-signature';
      const token = `${header}.${encodedPayload}.${signature}`;

      const result = decodeJwt(token);

      expect(result).toBeNull();
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Schema validation failed for "JWT payload"'),
        expect.any(Object)
      );
    });

    it('should return null for token with non-email in email field', () => {
      const invalidPayload = {
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sub: 'user123',
        email: 'not-an-email',
      };

      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const encodedPayload = btoa(JSON.stringify(invalidPayload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const signature = 'fake-signature';
      const token = `${header}.${encodedPayload}.${signature}`;

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

      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const encodedPayload = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const signature = 'fake-signature';
      const token = `${header}.${encodedPayload}.${signature}`;

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

      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const encodedPayload = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const signature = 'fake-signature';
      const token = `${header}.${encodedPayload}.${signature}`;

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

      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const encodedPayload = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const signature = 'fake-signature';
      const token = `${header}.${encodedPayload}.${signature}`;

      const result = isTokenExpired(token);

      expect(result).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty payload gracefully', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const emptyPayload = btoa('')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const signature = 'fake-signature';
      const token = `${header}.${emptyPayload}.${signature}`;

      const result = decodeJwt(token);

      expect(result).toBeNull();
    });

    it('should handle token with extra fields', () => {
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sub: 'user123',
        email: 'user@example.com',
        role: 'admin',
        extra: 'field',
      };

      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const encodedPayload = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const signature = 'fake-signature';
      const token = `${header}.${encodedPayload}.${signature}`;

      const result = decodeJwt(token);

      // Should only return validated fields
      expect(result).toBeTruthy();
      expect(result?.exp).toBe(payload.exp);
      expect(result?.email).toBe(payload.email);
    });

    it('should handle token with special characters in email', () => {
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sub: 'user123',
        email: 'user+test@example.com',
      };

      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const encodedPayload = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const signature = 'fake-signature';
      const token = `${header}.${encodedPayload}.${signature}`;

      const result = decodeJwt(token);

      expect(result?.email).toBe('user+test@example.com');
    });
  });
});
