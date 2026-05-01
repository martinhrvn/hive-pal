import { safeJsonParse } from './safe-json-parse';
import { z } from 'zod';

describe('safeJsonParse (Backend)', () => {
  let mockLogger: {
    error: jest.Mock;
    warn: jest.Mock;
  };

  beforeEach(() => {
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
  });

  describe('Null/Undefined/Empty Input Handling', () => {
    it('should return null for null input without logging', () => {
      const schema = z.array(z.string());
      const result = safeJsonParse(null, schema, mockLogger as any, 'test context');
      expect(result).toBeNull();
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should return null for undefined input without logging', () => {
      const schema = z.array(z.string());
      const result = safeJsonParse(undefined, schema, mockLogger as any, 'test context');
      expect(result).toBeNull();
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should return null for empty string without logging', () => {
      const schema = z.array(z.string());
      const result = safeJsonParse('', schema, mockLogger as any, 'test context');
      expect(result).toBeNull();
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should return null for whitespace-only string without logging', () => {
      const schema = z.array(z.string());
      const result = safeJsonParse('   ', schema, mockLogger as any, 'test context');
      expect(result).toBeNull();
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });

  describe('Valid JSON Parsing', () => {
    it('should parse valid array of strings', () => {
      const schema = z.array(z.string());
      const input = JSON.stringify(['a', 'b', 'c']);
      const result = safeJsonParse(input, schema, mockLogger as any, 'test context');
      expect(result).toEqual(['a', 'b', 'c']);
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
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
      const result = safeJsonParse(input, schema, mockLogger as any, 'JWT payload');
      expect(result).toEqual({
        exp: 1234567890,
        iat: 1234567890,
        sub: 'user123',
        email: 'user@example.com',
      });
    });

    it('should parse complex nested structures', () => {
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
      const result = safeJsonParse(input, schema, mockLogger as any, 'dismissed releases');
      expect(result).toEqual([
        { version: '1.0.0', dismissedAt: '2024-01-01' },
        { version: '2.0.0', dismissedAt: '2024-01-02' },
      ]);
    });
  });

  describe('Malformed JSON Error Handling', () => {
    it('should return null and log error for invalid JSON syntax', () => {
      const schema = z.array(z.string());
      const result = safeJsonParse('invalid json', schema, mockLogger as any, 'test context');
      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
      const errorCall = mockLogger.error.mock.calls[0];
      expect(String(errorCall[0])).toContain('Failed to parse JSON for "test context"');
    });

    it('should include first 100 chars of input in error log', () => {
      const schema = z.array(z.string());
      const longInvalidJson = '{invalid' + 'x'.repeat(200);
      const result = safeJsonParse(longInvalidJson, schema, mockLogger as any, 'test');
      expect(result).toBeNull();
      const errorCall = mockLogger.error.mock.calls[0];
      const metadata = errorCall[1];
      expect(metadata.snippet).toHaveLength(100);
      expect(metadata.snippet).toBe(longInvalidJson.substring(0, 100));
    });

    it('should include original error in log', () => {
      const schema = z.array(z.string());
      const result = safeJsonParse('invalid', schema, mockLogger as any, 'test');
      expect(result).toBeNull();
      const errorCall = mockLogger.error.mock.calls[0];
      const metadata = errorCall[1];
      expect(metadata.originalError).toBeInstanceOf(Error);
    });
  });

  describe('Schema Validation Error Handling', () => {
    it('should return null and log warning for type mismatch', () => {
      const schema = z.array(z.string());
      const input = JSON.stringify([1, 2, 3]);
      const result = safeJsonParse(input, schema, mockLogger as any, 'test context');
      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalled();
      const warnCall = mockLogger.warn.mock.calls[0];
      expect(String(warnCall[0])).toContain('Schema validation failed for "test context"');
    });

    it('should return null and log warning for missing required fields', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number(),
      });
      const input = JSON.stringify({ email: 'user@example.com' });
      const result = safeJsonParse(input, schema, mockLogger as any, 'test');
      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should return null and log warning for nested validation errors', () => {
      const schema = z.object({
        items: z.array(
          z.object({
            id: z.number(),
            name: z.string(),
          }),
        ),
      });
      const input = JSON.stringify({
        items: [{ id: 'invalid', name: 'test' }],
      });
      const result = safeJsonParse(input, schema, mockLogger as any, 'nested test');
      expect(result).toBeNull();
      const warnCall = mockLogger.warn.mock.calls[0];
      const metadata = warnCall[1];
      expect(metadata.validationErrors).toBeDefined();
    });

    it('should include Zod validation errors in warning', () => {
      const schema = z.object({
        email: z.string().email(),
      });
      const input = JSON.stringify({ email: 'not-an-email' });
      const result = safeJsonParse(input, schema, mockLogger as any, 'email validation');
      expect(result).toBeNull();
      const warnCall = mockLogger.warn.mock.calls[0];
      const metadata = warnCall[1];
      expect(Array.isArray(metadata.validationErrors)).toBe(true);
    });
  });

  describe('Type Safety', () => {
    it('should preserve type information from schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });
      const input = JSON.stringify({ name: 'John', age: 30 });
      const result = safeJsonParse(input, schema, mockLogger as any, 'test');
      if (result !== null) {
        const name: string = result.name;
        const age: number = result.age;
        expect(name).toBe('John');
        expect(age).toBe(30);
      }
    });

    it('should infer correct type for array schema', () => {
      const schema = z.array(z.string());
      const input = JSON.stringify(['a', 'b', 'c']);
      const result = safeJsonParse(input, schema, mockLogger as any, 'test');
      if (result !== null) {
        const items: string[] = result;
        expect(items).toEqual(['a', 'b', 'c']);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array', () => {
      const schema = z.array(z.string());
      const input = JSON.stringify([]);
      const result = safeJsonParse(input, schema, mockLogger as any, 'test');
      expect(result).toEqual([]);
    });

    it('should handle empty object', () => {
      const schema = z.object({});
      const input = JSON.stringify({});
      const result = safeJsonParse(input, schema, mockLogger as any, 'test');
      expect(result).toEqual({});
    });

    it('should handle JSON with null values', () => {
      const schema = z.object({
        value: z.string().nullable(),
      });
      const input = JSON.stringify({ value: null });
      const result = safeJsonParse(input, schema, mockLogger as any, 'test');
      expect(result).toEqual({ value: null });
    });

    it('should handle boolean values', () => {
      const schema = z.boolean();
      const result = safeJsonParse('true', schema, mockLogger as any, 'test');
      expect(result).toBe(true);
    });

    it('should handle numeric values', () => {
      const schema = z.number();
      const result = safeJsonParse('42', schema, mockLogger as any, 'test');
      expect(result).toBe(42);
    });
  });

  describe('Context String Usage', () => {
    it('should include context string in error messages', () => {
      const schema = z.array(z.string());
      safeJsonParse('invalid json', schema, mockLogger as any, 'score warnings');
      expect(mockLogger.error).toHaveBeenCalled();
      const errorCall = mockLogger.error.mock.calls[0];
      expect(String(errorCall[0])).toContain('score warnings');
    });

    it('should include context string in warning messages', () => {
      const schema = z.array(z.number());
      const input = JSON.stringify(['not', 'numbers']);
      safeJsonParse(input, schema, mockLogger as any, 'box configuration');
      expect(mockLogger.warn).toHaveBeenCalled();
      const warnCall = mockLogger.warn.mock.calls[0];
      expect(String(warnCall[0])).toContain('box configuration');
    });
  });
});
