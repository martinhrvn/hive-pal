import { safeJsonParse } from './safe-json-parse';
import { z } from 'zod';
import { Logger } from 'winston';

/**
 * Integration tests for safe JSON parsing call sites
 * These tests verify the implementation matches the spec requirements for Group 2 tasks
 * Spec: openspec/changes/fix-unsafe-json-parsing/specs/safe-json-parsing/spec.md
 */

describe('Safe JSON Parsing - Integration Tests for Backend Call Sites', () => {
  let mockLogger: Logger & {
    error: jest.Mock;
    warn: jest.Mock;
    info: jest.Mock;
  };

  beforeEach(() => {
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    } as unknown as Logger & {
      error: jest.Mock;
      warn: jest.Mock;
      info: jest.Mock;
    };
  });

  describe('REQ-7: Backend Call Sites - Task 2.1 - Score Warnings (inspections.service.ts:728)', () => {
    const stringArraySchema = z.array(z.string());
    const context = 'score warnings';

    it('PASS: should parse valid score warnings array', () => {
      const validWarnings = JSON.stringify([
        'warning1',
        'warning2',
        'warning3',
      ]);
      const result = safeJsonParse(
        validWarnings,
        stringArraySchema,
        mockLogger,
        context,
      );

      expect(result).toEqual(['warning1', 'warning2', 'warning3']);
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('PASS: should return null for malformed JSON (fallback to calculated.warnings)', () => {
      const invalidJson = 'invalid json {[';
      const result = safeJsonParse(
        invalidJson,
        stringArraySchema,
        mockLogger,
        context,
      );

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockLogger.error.mock.calls[0][0]).toContain('score warnings');
    });

    it('PASS: should return null for null input (use calculated.warnings)', () => {
      const result = safeJsonParse(
        null,
        stringArraySchema,
        mockLogger,
        context,
      );

      expect(result).toBeNull();
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('PASS: should return null for schema mismatch (numbers instead of strings)', () => {
      const wrongType = JSON.stringify([1, 2, 3]);
      const result = safeJsonParse(
        wrongType,
        stringArraySchema,
        mockLogger,
        context,
      );

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockLogger.warn.mock.calls[0][0]).toContain('score warnings');
    });

    it('PASS: should handle empty array correctly', () => {
      const emptyArray = JSON.stringify([]);
      const result = safeJsonParse(
        emptyArray,
        stringArraySchema,
        mockLogger,
        context,
      );

      expect(result).toEqual([]);
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('PASS: call site uses nullish coalescing to provide fallback', () => {
      // Simulating the actual call site pattern: ?? []
      const nullResult = safeJsonParse(
        null,
        stringArraySchema,
        mockLogger,
        context,
      );
      const fallback = nullResult ?? ['fallback_warning'];

      expect(fallback).toEqual(['fallback_warning']);
    });
  });

  describe('REQ-7: Backend Call Sites - Task 2.2 - Box Configuration (hive.service.ts:38)', () => {
    const stringArraySchema = z.array(z.string());
    const context = 'box configuration';

    it('PASS: should parse valid box configuration array', () => {
      const validConfig = JSON.stringify(['box1', 'box2', 'box3']);
      const result = safeJsonParse(
        validConfig,
        stringArraySchema,
        mockLogger,
        context,
      );

      expect(result).toEqual(['box1', 'box2', 'box3']);
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('PASS: should return null for malformed JSON', () => {
      const invalidJson = '{malformed';
      const result = safeJsonParse(
        invalidJson,
        stringArraySchema,
        mockLogger,
        context,
      );

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockLogger.error.mock.calls[0][0]).toContain('box configuration');
    });

    it('PASS: should return null for undefined input', () => {
      const result = safeJsonParse(
        undefined,
        stringArraySchema,
        mockLogger,
        context,
      );

      expect(result).toBeNull();
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('PASS: should handle mixed content in array (validates type)', () => {
      const mixedArray = JSON.stringify(['string', 123, 'another']);
      const result = safeJsonParse(
        mixedArray,
        stringArraySchema,
        mockLogger,
        context,
      );

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('PASS: parseJsonArray function returns empty array as fallback', () => {
      // Simulating the parseJsonArray function pattern: ?? []
      const nullResult = safeJsonParse(
        '',
        stringArraySchema,
        mockLogger,
        context,
      );
      const fallback = nullResult ?? [];

      expect(fallback).toEqual([]);
    });
  });

  describe('REQ-7: Backend Call Sites - Task 2.3 - Sentry Test (test-sentry.controller.ts:15)', () => {
    const unknownSchema = z.unknown();
    const context = 'Sentry test';

    it('PASS: should intentionally fail for invalid JSON', () => {
      const invalidJson = 'invalid json';
      const result = safeJsonParse(
        invalidJson,
        unknownSchema,
        mockLogger,
        context,
      );

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('PASS: should log error with Sentry test context', () => {
      const invalidJson = 'invalid json';
      safeJsonParse(invalidJson, unknownSchema, mockLogger, context);

      expect(mockLogger.error.mock.calls[0][0]).toContain('Sentry test');
    });

    it('PASS: z.unknown() schema accepts any valid JSON', () => {
      const validJson = JSON.stringify({ anything: 'goes' });
      const result = safeJsonParse(
        validJson,
        unknownSchema,
        mockLogger,
        context,
      );

      expect(result).toEqual({ anything: 'goes' });
    });

    it('PASS: Sentry test controller pattern - check for null and throw', () => {
      const result = safeJsonParse(
        'invalid json',
        unknownSchema,
        mockLogger,
        context,
      );

      // Simulating the controller logic
      if (result === null) {
        const error = new Error(
          'JSON parsing intentionally failed for Sentry test',
        );
        expect(error.message).toContain('intentionally failed');
      } else {
        fail('Expected result to be null');
      }
    });
  });

  describe('REQ-3: Null/Undefined Handling - Cross-Call-Site Verification', () => {
    const stringArraySchema = z.array(z.string());

    it('PASS: All call sites should handle null without logging', () => {
      const contexts = ['score warnings', 'box configuration', 'Sentry test'];

      contexts.forEach((context) => {
        const result = safeJsonParse(
          null,
          stringArraySchema,
          mockLogger,
          context,
        );
        expect(result).toBeNull();
      });

      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('PASS: All call sites should handle empty string without logging', () => {
      const contexts = ['score warnings', 'box configuration', 'Sentry test'];

      contexts.forEach((context) => {
        const result = safeJsonParse(
          '',
          stringArraySchema,
          mockLogger,
          context,
        );
        expect(result).toBeNull();
      });

      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });

  describe('REQ-4: JSON Syntax Error Handling - Cross-Call-Site Verification', () => {
    const stringArraySchema = z.array(z.string());

    it('PASS: All call sites should log JSON syntax errors', () => {
      const testCases = [
        { context: 'score warnings', invalid: '{invalid}' },
        { context: 'box configuration', invalid: '[malformed' },
        { context: 'Sentry test', invalid: 'not json at all' },
      ];

      testCases.forEach(({ context, invalid }) => {
        mockLogger.error.mockClear();
        const result = safeJsonParse(
          invalid,
          stringArraySchema,
          mockLogger,
          context,
        );

        expect(result).toBeNull();
        expect(mockLogger.error).toHaveBeenCalledTimes(1);
        expect(mockLogger.error.mock.calls[0][0]).toContain(context);
      });
    });

    it('PASS: Should truncate long strings to 100 characters in logs', () => {
      const longInvalidJson = '{invalid' + 'x'.repeat(200);
      const result = safeJsonParse(
        longInvalidJson,
        stringArraySchema,
        mockLogger,
        'test',
      );

      expect(result).toBeNull();
      const errorCall = (mockLogger.error as jest.Mock).mock
        .calls[0] as unknown[];
      const metadata = errorCall[1] as Record<string, unknown>;
      expect(metadata.snippet).toHaveLength(100);
      expect(metadata.snippet).toBe(longInvalidJson.substring(0, 100));
    });
  });

  describe('REQ-5: Schema Validation Error Handling - Cross-Call-Site Verification', () => {
    it('PASS: Should log schema validation errors at WARN level', () => {
      const testCases = [
        {
          context: 'score warnings',
          schema: z.array(z.string()),
          invalid: JSON.stringify([1, 2, 3]),
        },
        {
          context: 'box configuration',
          schema: z.array(z.string()),
          invalid: JSON.stringify({ not: 'array' }),
        },
      ];

      testCases.forEach(({ context, schema, invalid }) => {
        mockLogger.warn.mockClear();
        const result = safeJsonParse(invalid, schema, mockLogger, context);

        expect(result).toBeNull();
        expect(mockLogger.warn).toHaveBeenCalledTimes(1);
        expect(mockLogger.warn.mock.calls[0][0]).toContain(context);
        expect(mockLogger.warn.mock.calls[0][1].validationErrors).toBeDefined();
      });
    });
  });

  describe('REQ-6: Type Safety Verification', () => {
    it('PASS: Return type should be inferred from schema', () => {
      const stringArraySchema = z.array(z.string());
      const result = safeJsonParse(
        JSON.stringify(['a', 'b']),
        stringArraySchema,
        mockLogger,
        'test',
      );

      if (result !== null) {
        // TypeScript should infer result as string[]
        const typedResult: string[] = result;
        expect(typedResult).toEqual(['a', 'b']);
      }
    });

    it('PASS: Complex schema type inference', () => {
      const complexSchema = z.object({
        id: z.number(),
        name: z.string(),
        tags: z.array(z.string()),
      });

      const result = safeJsonParse(
        JSON.stringify({ id: 1, name: 'test', tags: ['tag1'] }),
        complexSchema,
        mockLogger,
        'test',
      );

      if (result !== null) {
        // TypeScript should infer the correct structure
        expect(result.id).toBe(1);
        expect(result.name).toBe('test');
        expect(result.tags).toEqual(['tag1']);
      }
    });
  });

  describe('Edge Cases - Real-World Scenarios', () => {
    const stringArraySchema = z.array(z.string());

    it('PASS: Should handle database NULL values gracefully', () => {
      // Simulating database returning null for scoreWarnings field
      const dbValue = null;
      const result = safeJsonParse(
        dbValue,
        stringArraySchema,
        mockLogger,
        'score warnings',
      );

      expect(result).toBeNull();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('PASS: Should handle corrupted data from database', () => {
      // Simulating corrupted JSON string in database
      const corruptedData = '["warning1", "warning2"'; // missing closing bracket
      const result = safeJsonParse(
        corruptedData,
        stringArraySchema,
        mockLogger,
        'score warnings',
      );

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('PASS: Should handle Unicode characters in JSON', () => {
      const unicodeData = JSON.stringify(['警告', 'Achtung', '⚠️']);
      const result = safeJsonParse(
        unicodeData,
        stringArraySchema,
        mockLogger,
        'score warnings',
      );

      expect(result).toEqual(['警告', 'Achtung', '⚠️']);
    });

    it('PASS: Should handle special characters in strings', () => {
      const specialChars = JSON.stringify([
        'warning\\nwith\\nnewlines',
        'with\ttabs',
        'with"quotes"',
      ]);
      const result = safeJsonParse(
        specialChars,
        stringArraySchema,
        mockLogger,
        'score warnings',
      );

      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
    });

    it('PASS: Should handle very large arrays', () => {
      const largeArray = new Array(1000).fill('warning');
      const largeJson = JSON.stringify(largeArray);
      const result = safeJsonParse(
        largeJson,
        stringArraySchema,
        mockLogger,
        'score warnings',
      );

      expect(result).toEqual(largeArray);
      expect(result?.length).toBe(1000);
    });

    it('PASS: Should handle whitespace-padded JSON', () => {
      const paddedJson = '  \n\t  ["warning1", "warning2"]  \n\t  ';
      const result = safeJsonParse(
        paddedJson,
        stringArraySchema,
        mockLogger,
        'score warnings',
      );

      expect(result).toEqual(['warning1', 'warning2']);
    });
  });

  describe('Security Scenarios', () => {
    const stringArraySchema = z.array(z.string());

    it('PASS: Should safely handle potential XSS payloads in JSON', () => {
      const xssPayload = JSON.stringify(['<script>alert("xss")</script>']);
      const result = safeJsonParse(
        xssPayload,
        stringArraySchema,
        mockLogger,
        'score warnings',
      );

      expect(result).toEqual(['<script>alert("xss")</script>']);
      // The utility doesn't sanitize - that's the caller's responsibility
    });

    it('PASS: Should safely handle potential SQL injection attempts', () => {
      const sqlPayload = JSON.stringify(["'; DROP TABLE inspections; --"]);
      const result = safeJsonParse(
        sqlPayload,
        stringArraySchema,
        mockLogger,
        'score warnings',
      );

      expect(result).toEqual(["'; DROP TABLE inspections; --"]);
    });

    it('FAIL: Should prevent prototype pollution attempts', () => {
      const prototypePayload = '{"__proto__":{"polluted":"yes"}}';
      const anySchema = z.unknown();
      const result = safeJsonParse(
        prototypePayload,
        anySchema,
        mockLogger,
        'test',
      );

      expect(result).toBeTruthy();
      // Verify prototype was not polluted

      expect((Object.prototype as any).polluted).toBeUndefined();
    });
  });
});
