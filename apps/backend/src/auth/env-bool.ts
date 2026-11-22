/** Reads a boolean env var ("true", "1", "yes", "on"); blank means `fallback`. */
export const parseBool = (
  value: string | undefined,
  fallback: boolean,
): boolean => {
  if (value === undefined || value.trim() === '') return fallback;
  return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
};
