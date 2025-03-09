export function defaultToUndefined<T>(
  value: T | null | undefined,
): T | undefined {
  return value ?? undefined;
}
