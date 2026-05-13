import { apiarySettingsSchema, InspectionType } from '../apiaries';

/**
 * Parse apiary inspection type from unknown data.
 *
 * Attempts to parse the provided data as an ApiarySettings object using Zod schema validation.
 * If parsing succeeds, extracts and returns the inspectionType field.
 * If parsing fails or the field is missing, defaults to 'data_driven'.
 *
 * @param raw - Unknown data to parse as apiary settings
 * @returns Parsed InspectionType or 'data_driven' as default
 */
export function parseApiaryInspectionType(raw: unknown): InspectionType {
  const result = apiarySettingsSchema.safeParse(raw);
  return result.success
    ? (result.data?.inspectionType ?? 'data_driven')
    : 'data_driven';
}
