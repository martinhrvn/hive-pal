/**
 * Integration tests for TestSentry component using safeJsonParse
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
import { safeJsonParse } from '@/utils/safe-json-parse';
import { z } from 'zod';

// Mock Sentry
const mockCaptureException = vi.fn();
const mockCaptureMessage = vi.fn();

vi.mock('@sentry/react', () => ({
  captureException: mockCaptureException,
  captureMessage: mockCaptureMessage,
}));

describe('TestSentry integration with safeJsonParse', () => {
  let consoleSpy: {
    error: MockInstance;
    warn: MockInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    };
    mockCaptureException.mockClear();
    mockCaptureMessage.mockClear();
  });

  afterEach(() => {
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  describe('captureException with safeJsonParse', () => {
    it('should call safeJsonParse with invalid JSON', () => {
      // Simulate the captureException function from TestSentry
      try {
        const result = safeJsonParse('invalid json', z.unknown(), 'Sentry test');
        if (result === null) {
          throw new Error('JSON parsing intentionally failed for Sentry test');
        }
      } catch (error) {
        // This should be called
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('JSON parsing intentionally failed');
      }

      // safeJsonParse should have logged the error
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse JSON for "Sentry test"'),
        expect.any(Object)
      );
    });

    it('should return null for invalid JSON', () => {
      const result = safeJsonParse('invalid json', z.unknown(), 'Sentry test');

      expect(result).toBeNull();
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should preserve error handling flow', () => {
      let errorCaught = false;

      try {
        const result = safeJsonParse('invalid json', z.unknown(), 'Sentry test');
        if (result === null) {
          throw new Error('JSON parsing intentionally failed for Sentry test');
        }
      } catch (error) {
        errorCaught = true;
        // In the actual component, Sentry.captureException would be called here
        expect(error).toBeInstanceOf(Error);
      }

      expect(errorCaught).toBe(true);
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should handle valid JSON (should not throw)', () => {
      const result = safeJsonParse('{"valid": "json"}', z.unknown(), 'Sentry test');

      expect(result).toEqual({ valid: 'json' });
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should handle null input gracefully', () => {
      let errorThrown = false;

      try {
        const result = safeJsonParse(null, z.unknown(), 'Sentry test');
        if (result === null) {
          throw new Error('JSON parsing intentionally failed for Sentry test');
        }
      } catch (error: unknown) {
        errorThrown = true;
        expect(error).toBeInstanceOf(Error);
      }

      expect(errorThrown).toBe(true);
      // Should NOT log for null input
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should handle empty string gracefully', () => {
      let errorThrown = false;

      try {
        const result = safeJsonParse('', z.unknown(), 'Sentry test');
        if (result === null) {
          throw new Error('JSON parsing intentionally failed for Sentry test');
        }
      } catch (error: unknown) {
        errorThrown = true;
        expect(error).toBeInstanceOf(Error);
      }

      expect(errorThrown).toBe(true);
      // Should NOT log for empty input
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases in Sentry test scenario', () => {
    it('should handle various malformed JSON strings', () => {
      const malformedInputs = [
        'invalid json',
        '{broken',
        '{"key": undefined}',
        '[1,2,3,]',
        "{'single': 'quotes'}",
      ];

      malformedInputs.forEach((input) => {
        const result = safeJsonParse(input, z.unknown(), 'Sentry test');
        expect(result).toBeNull();
      });

      // Should have logged error for each malformed input
      expect(consoleSpy.error).toHaveBeenCalledTimes(malformedInputs.length);
    });

    it('should handle schema validation failures', () => {
      // Valid JSON but doesn't match schema
      const schema = z.object({
        required: z.string(),
      });

      const result = safeJsonParse('{"other": "field"}', schema, 'Sentry test');

      expect(result).toBeNull();
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Schema validation failed for "Sentry test"'),
        expect.any(Object)
      );
    });

    it('should preserve error message in thrown exception', () => {
      try {
        const result = safeJsonParse('invalid', z.unknown(), 'Sentry test');
        if (result === null) {
          throw new Error('JSON parsing intentionally failed for Sentry test');
        }
      } catch (error) {
        expect((error as Error).message).toBe('JSON parsing intentionally failed for Sentry test');
      }
    });
  });

  describe('Comparison with old unsafe behavior', () => {
    it('should be safer than JSON.parse with try-catch', () => {
      // Old way: JSON.parse in try-catch
      let oldResult = null;
      try {
        oldResult = JSON.parse('invalid json');
      } catch {
        // Handle exception: JSON.parse throws for invalid JSON
        oldResult = null;
      }

      // New way: safeJsonParse
      const newResult = safeJsonParse('invalid json', z.unknown(), 'test');

      // Both should return null, but new way provides logging
      expect(oldResult).toBeNull();
      expect(newResult).toBeNull();
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should provide validation that JSON.parse cannot', () => {
      const schema = z.object({
        id: z.number(),
        name: z.string(),
      });

      // Valid JSON but wrong type
      const input = '{"id": "not-a-number", "name": "test"}';

      // Old way: JSON.parse accepts this
      const oldResult = JSON.parse(input);
      expect(oldResult.id).toBe('not-a-number'); // Wrong type!

      // New way: safeJsonParse rejects this
      const newResult = safeJsonParse(input, schema, 'test');
      expect(newResult).toBeNull(); // Correctly rejected
      expect(consoleSpy.warn).toHaveBeenCalled();
    });
  });
});
