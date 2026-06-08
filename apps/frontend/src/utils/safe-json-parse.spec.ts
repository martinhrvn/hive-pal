import { safeJsonParse } from './safe-json-parse';
import { z } from 'zod';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type MockInstance,
} from 'vitest';

describe('safeJsonParse (Frontend)', () => {
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

  describe('Null/Undefined/Empty Input Handling', () => {
    it('should return null for null input without logging', () => {
      const schema = z.array(z.string());
      const result = safeJsonParse(null, schema, 'test context');

      expect(result).toBeNull();
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should return null for undefined input without logging', () => {
      const schema = z.array(z.string());
      const result = safeJsonParse(undefined, schema, 'test context');

      expect(result).toBeNull();
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should return null for empty string without logging', () => {
      const schema = z.array(z.string());
      const result = safeJsonParse('', schema, 'test context');

      expect(result).toBeNull();
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should return null for whitespace-only string without logging', () => {
      const schema = z.array(z.string());
      const result = safeJsonParse('   ', schema, 'test context');

      expect(result).toBeNull();
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
  });

  describe('Valid JSON Parsing', () => {
    it('should parse valid array of strings', () => {
      const schema = z.array(z.string());
      const input = JSON.stringify(['a', 'b', 'c']);
      const result = safeJsonParse(input, schema, 'test context');

      expect(result).toEqual(['a', 'b', 'c']);
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should parse valid JWT payload', () => {
      const schema = z.object({
        exp: z.number(),
        iat: z.number(),
        sub: z.string(),
        email: z.string().email(),
      });
      const input = JSON.stringify({
        exp: 1234567890,
        iat: 1234567890,
        sub: 'user123',
        email: 'user@example.com',
      });
      const result = safeJsonParse(input, schema, 'JWT payload');

      expect(result).toEqual({
        exp: 1234567890,
        iat: 1234567890,
        sub: 'user123',
        email: 'user@example.com',
      });
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should parse dismissed releases from localStorage', () => {
      const schema = z.array(
        z.object({
          version: z.string(),
          dismissedAt: z.string(),
        }),
      );
      const input = JSON.stringify([
        { version: '1.0.0', dismissedAt: '2024-01-01' },
        { version: '2.0.0', dismissedAt: '2024-01-02' },
      ]);
      const result = safeJsonParse(input, schema, 'dismissed releases');

      expect(result).toEqual([
        { version: '1.0.0', dismissedAt: '2024-01-01' },
        { version: '2.0.0', dismissedAt: '2024-01-02' },
      ]);
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should parse complex nested structures', () => {
      const schema = z.array(
        z.object({
          id: z.number(),
          tags: z.array(z.string()),
          metadata: z.record(z.unknown()),
        }),
      );
      const input = JSON.stringify([
        {
          id: 1,
          tags: ['tag1', 'tag2'],
          metadata: { key: 'value' },
        },
      ]);
      const result = safeJsonParse(input, schema, 'complex nested');

      expect(result).toEqual([
        {
          id: 1,
          tags: ['tag1', 'tag2'],
          metadata: { key: 'value' },
        },
      ]);
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
  });

  describe('Malformed JSON Error Handling', () => {
    it('should return null and console.error for invalid JSON syntax', () => {
      const schema = z.array(z.string());
      const result = safeJsonParse('invalid json', schema, 'test context');

      expect(result).toBeNull();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse JSON for "test context"'),
        expect.objectContaining({
          context: 'safeJsonParse',
          snippet: 'invalid json',
        }),
      );
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should include first 100 chars of input in error log', () => {
      const schema = z.array(z.string());
      const longInvalidJson = '{invalid' + 'x'.repeat(200);
      const result = safeJsonParse(longInvalidJson, schema, 'test');

      expect(result).toBeNull();
      expect(consoleSpy.error).toHaveBeenCalled();
      const call = consoleSpy.error.mock.calls[0];
      expect(call[1]).toHaveProperty('snippet');
      expect(call[1].snippet).toHaveLength(100);
      expect(call[1].snippet).toBe(longInvalidJson.substring(0, 100));
    });

    it('should include original error in log', () => {
      const schema = z.array(z.string());
      const result = safeJsonParse('invalid', schema, 'test');

      expect(result).toBeNull();
      expect(consoleSpy.error).toHaveBeenCalled();
      const call = consoleSpy.error.mock.calls[0];
      expect(call[1]).toHaveProperty('originalError');
      expect(call[1].originalError).toBeInstanceOf(Error);
    });
  });

  describe('Schema Validation Error Handling', () => {
    it('should return null and console.warn for type mismatch', () => {
      const schema = z.array(z.string());
      const input = JSON.stringify([1, 2, 3]); // numbers instead of strings
      const result = safeJsonParse(input, schema, 'test context');

      expect(result).toBeNull();
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Schema validation failed for "test context"'),
        expect.objectContaining({
          context: 'safeJsonParse',
          snippet: input,
        }),
      );
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it('should return null and console.warn for missing required fields', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number(),
      });
      const input = JSON.stringify({ email: 'user@example.com' }); // missing age
      const result = safeJsonParse(input, schema, 'test');

      expect(result).toBeNull();
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it('should return null and console.warn for invalid email format', () => {
      const schema = z.object({
        email: z.string().email(),
      });
      const input = JSON.stringify({ email: 'not-an-email' });
      const result = safeJsonParse(input, schema, 'email validation');

      expect(result).toBeNull();
      expect(consoleSpy.warn).toHaveBeenCalled();
      const call = consoleSpy.warn.mock.calls[0];
      expect(call[1]).toHaveProperty('validationErrors');
    });

    it('should return null and console.warn for nested validation errors', () => {
      const schema = z.object({
        items: z.array(
          z.object({
            id: z.number(),
            name: z.string(),
          }),
        ),
      });
      const input = JSON.stringify({
        items: [{ id: 'invalid', name: 'test' }], // id should be number
      });
      const result = safeJsonParse(input, schema, 'nested test');

      expect(result).toBeNull();
      expect(consoleSpy.warn).toHaveBeenCalled();
      const call = consoleSpy.warn.mock.calls[0];
      expect(call[1]).toHaveProperty('validationErrors');
    });

    it('should include Zod validation errors in warning', () => {
      const schema = z.object({
        version: z.string(),
      });
      const input = JSON.stringify({ version: 123 }); // should be string
      const result = safeJsonParse(input, schema, 'version validation');

      expect(result).toBeNull();
      const call = consoleSpy.warn.mock.calls[0];
      expect(call[1]).toHaveProperty('validationErrors');
      expect(Array.isArray(call[1].validationErrors)).toBe(true);
    });
  });

  describe('Type Safety', () => {
    it('should preserve type information from schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });
      const input = JSON.stringify({ name: 'John', age: 30 });
      const result = safeJsonParse(input, schema, 'test');

      // TypeScript type checking (compile-time)
      if (result !== null) {
        // These should be type-safe
        const name: string = result.name;
        const age: number = result.age;
        expect(name).toBe('John');
        expect(age).toBe(30);
      }
    });

    it('should infer correct type for array schema', () => {
      const schema = z.array(z.string());
      const input = JSON.stringify(['a', 'b', 'c']);
      const result = safeJsonParse(input, schema, 'test');

      if (result !== null) {
        // Type should be string[]
        const items: string[] = result;
        expect(items).toEqual(['a', 'b', 'c']);
      }
    });

    it('should infer correct type for JWT payload', () => {
      const schema = z.object({
        exp: z.number(),
        iat: z.number(),
        sub: z.string(),
        email: z.string().email(),
      });
      const input = JSON.stringify({
        exp: 1234567890,
        iat: 1234567890,
        sub: 'user123',
        email: 'user@example.com',
      });
      const result = safeJsonParse(input, schema, 'JWT');

      if (result !== null) {
        // Type should be correctly inferred
        expect(typeof result.exp).toBe('number');
        expect(typeof result.email).toBe('string');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array', () => {
      const schema = z.array(z.string());
      const input = JSON.stringify([]);
      const result = safeJsonParse(input, schema, 'test');

      expect(result).toEqual([]);
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should handle empty object', () => {
      const schema = z.object({});
      const input = JSON.stringify({});
      const result = safeJsonParse(input, schema, 'test');

      expect(result).toEqual({});
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should handle JSON with null values', () => {
      const schema = z.object({
        value: z.string().nullable(),
      });
      const input = JSON.stringify({ value: null });
      const result = safeJsonParse(input, schema, 'test');

      expect(result).toEqual({ value: null });
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should handle boolean values', () => {
      const schema = z.boolean();
      const result = safeJsonParse('true', schema, 'test');

      expect(result).toBe(true);
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should handle numeric values', () => {
      const schema = z.number();
      const result = safeJsonParse('42', schema, 'test');

      expect(result).toBe(42);
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should handle string values', () => {
      const schema = z.string();
      const result = safeJsonParse('"hello"', schema, 'test');

      expect(result).toBe('hello');
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
  });

  describe('Context String Usage', () => {
    it('should include context string in error messages', () => {
      const schema = z.array(z.string());
      safeJsonParse('invalid json', schema, 'JWT payload');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('JWT payload'),
        expect.any(Object),
      );
    });

    it('should include context string in warning messages', () => {
      const schema = z.array(z.number());
      const input = JSON.stringify(['not', 'numbers']);
      safeJsonParse(input, schema, 'dismissed releases');

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('dismissed releases'),
        expect.any(Object),
      );
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle JWT token payload correctly', () => {
      const schema = z.object({
        exp: z.number(),
        iat: z.number(),
        sub: z.string(),
        email: z.string().email(),
      });

      // Simulate a real JWT payload
      const jwtPayload = {
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sub: 'user-id-123',
        email: 'user@example.com',
      };

      const result = safeJsonParse(JSON.stringify(jwtPayload), schema, 'JWT payload');
      expect(result).toEqual(jwtPayload);
    });

    it('should handle localStorage dismissed releases correctly', () => {
      const schema = z.array(
        z.object({
          version: z.string(),
          dismissedAt: z.string(),
        }),
      );

      const releases = [
        { version: '1.0.0', dismissedAt: '2024-01-01T00:00:00Z' },
        { version: '2.0.0', dismissedAt: '2024-02-01T00:00:00Z' },
      ];

      const result = safeJsonParse(JSON.stringify(releases), schema, 'dismissed releases');
      expect(result).toEqual(releases);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      const schema = z.array(
        z.object({
          version: z.string(),
          dismissedAt: z.string(),
        }),
      );

      const corruptedData = '[{incomplete json}';
      const result = safeJsonParse(corruptedData, schema, 'dismissed releases');

      expect(result).toBeNull();
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });
});
