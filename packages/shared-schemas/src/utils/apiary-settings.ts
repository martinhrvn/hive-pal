import {
  apiarySettingsSchema,
  type ApiarySettings,
} from '../apiaries/apiary.schema';

/**
 * Parse raw JSON apiary settings safely. Returns `undefined` when the stored
 * value does not match the schema, so callers can fall back to defaults.
 */
export function parseApiarySettings(raw: unknown): ApiarySettings {
  const result = apiarySettingsSchema.safeParse(raw);
  return result.success ? result.data : undefined;
}
