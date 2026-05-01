import { z } from 'zod';

/**
 * Safely parses a JSON string with Zod schema validation.
 * Uses console methods for errors and warnings.
 *
 * @param raw - The JSON string to parse (nullable)
 * @param schema - Zod schema for runtime validation
 * @param context - Descriptive context for error messages
 * @returns Validated data of type T, or null on any failure
 */
export function safeJsonParse<T>(
  raw: string | null | undefined,
  schema: z.ZodType<T>,
  context: string,
): T | null {
  // Handle null, undefined, and empty string - return null without logging
  if (!raw || raw.trim() === '') {
    return null;
  }

  // Attempt to parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    // Log JSON syntax errors at error level
    const snippet = raw.substring(0, 100);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to parse JSON for "${context}": ${errorMessage}`, {
      context: 'safeJsonParse',
      snippet,
      originalError: error,
    });
    return null;
  }

  // Validate parsed data against schema
  const result = schema.safeParse(parsed);
  if (!result.success) {
    // Log validation errors at warn level
    const snippet = raw.substring(0, 100);
    const zodErrors = result.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('; ');
    console.warn(`Schema validation failed for "${context}": ${zodErrors}`, {
      context: 'safeJsonParse',
      snippet,
      validationErrors: result.error.errors,
    });
    return null;
  }

  return result.data;
}
