/**
 * Parse a byte limit (e.g. a multer `limits.fileSize`) from configuration.
 *
 * Environment variables always arrive as strings, so `ConfigService.get<number>()`
 * only pretends to return a number. busboy (multer >= 2.4) rejects anything that
 * is not a non-negative integer or Infinity with
 * "Expected limits.fileSize to be a non-negative integer or Infinity".
 *
 * Accepts numbers and numeric strings. Empty, missing or invalid values fall
 * back to `fallback`.
 */
export function parseByteLimit(value: unknown, fallback: number): number {
  if (typeof value === 'number') {
    return isValidLimit(value) ? value : fallback;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return fallback;
    }
    const parsed = Number(trimmed);
    return isValidLimit(parsed) ? parsed : fallback;
  }
  return fallback;
}

function isValidLimit(n: number): boolean {
  return n === Infinity || (Number.isInteger(n) && n >= 0);
}
