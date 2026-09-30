import { z } from 'zod';

/**
 * Request schemas for the HivePal → HiveHub proxy (`/api/hivescale/*`).
 *
 * They mirror the pydantic models of the HiveHub app API
 * (`server/schemas.py`) so a bad request is rejected by HivePal with a readable
 * message instead of being forwarded and bounced as a 422.
 */

/** A device reports up to 18 hives, indexed 1-based. */
export const HIVEHUB_MAX_HIVES = 18;

export const hiveHubHiveIndexSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(HIVEHUB_MAX_HIVES);

const indexKeyedMap = <T extends z.ZodTypeAny>(value: T) =>
  z.record(z.string().regex(/^\d{1,2}$/), value).refine(
    map =>
      Object.keys(map).every(key => {
        const index = Number(key);
        return index >= 1 && index <= HIVEHUB_MAX_HIVES;
      }),
    { message: `hive index keys must be 1..${HIVEHUB_MAX_HIVES}` },
  );

export const hiveHubClaimDeviceSchema = z.object({
  claim_code: z.string().trim().min(4).max(128),
  display_name: z.string().trim().max(120).optional(),
  scale_1_display_name: z.string().trim().max(120).optional(),
  scale_2_display_name: z.string().trim().max(120).optional(),
});

/**
 * Hive names and HivePal hive links, keyed by hive index ("1".."18").
 * A name of `""` clears it; a hive id of `""`/`null` removes the link.
 */
export const hiveHubChannelsPatchSchema = z.object({
  scale_1_display_name: z.string().max(120).optional(),
  scale_2_display_name: z.string().max(120).optional(),
  names: indexKeyedMap(z.string().max(120).nullable()).optional(),
  hive_ids: indexKeyedMap(z.string().max(64).nullable()).optional(),
});

export const hiveHubTempcoSourceSchema = z.enum([
  'ambient',
  'hive_1',
  'hive_2',
]);

export const hiveHubHiveScaleCalibrationSchema = z.object({
  index: hiveHubHiveIndexSchema,
  scale: z.number().int().min(0).optional(),
  offset: z.number().int().optional(),
  factor: z
    .number()
    .refine(value => value !== 0, 'factor must not be zero')
    .optional(),
  tempco_kg_per_c: z.number().optional(),
});

export const hiveHubConfigPatchSchema = z
  .object({
    send_interval_seconds: z.number().int().min(60).max(86400),
    scale1_offset: z.number().int(),
    scale1_factor: z.number().refine(v => v !== 0, 'factor must not be zero'),
    scale2_offset: z.number().int(),
    scale2_factor: z.number().refine(v => v !== 0, 'factor must not be zero'),
    hive_scales: z
      .array(hiveHubHiveScaleCalibrationSchema)
      .max(HIVEHUB_MAX_HIVES),
    tempco_enabled: z.boolean(),
    tempco_source: hiveHubTempcoSourceSchema,
    tempco_ref_temp_c: z.number().min(-40).max(80),
    scale1_tempco_kg_per_c: z.number(),
    scale2_tempco_kg_per_c: z.number(),
    beecounter_night_mode_enabled: z.boolean(),
    beecounter_night_start_minute: z.number().int().min(0).max(1439),
    beecounter_night_end_minute: z.number().int().min(0).max(1439),
    beecounter_night_max_traffic: z.number().int().min(0),
    timezone: z.string().max(64),
    beecounter_bank1_enabled: z.boolean(),
    beecounter_bank2_enabled: z.boolean(),
    beecounter_bank3_enabled: z.boolean(),
    inspection_timeout_minutes: z.number().int().min(1).max(1440),
  })
  .partial()
  .refine(
    patch =>
      !(
        patch.beecounter_bank1_enabled === false &&
        patch.beecounter_bank2_enabled === false &&
        patch.beecounter_bank3_enabled === false
      ),
    { message: 'At least one HiveTraffic emitter bank must stay on' },
  );

export const hiveHubTempCompensationFitSchema = z.object({
  scale: hiveHubHiveIndexSchema,
  lookback_days: z.number().int().min(1).max(90).optional(),
  start_at: z.string().datetime({ offset: true }).optional(),
  end_at: z.string().datetime({ offset: true }).optional(),
  temp_source: hiveHubTempcoSourceSchema.optional(),
  calibration_mode_only: z.boolean().optional(),
  apply: z.boolean().optional(),
  set_ref_temp: z.boolean().optional(),
});

export const hiveHubCalibrationModeStartSchema = z.object({
  interval_seconds: z.number().int().min(1).max(3600).optional(),
  timeout_seconds: z.number().int().min(1).max(86400).optional(),
});

export const hiveHubShareDeviceSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(['admin', 'viewer']),
});

export const hiveHubMeasurementQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20000).optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  /** Server-side down-sampling for wide chart ranges. */
  max_points: z.coerce.number().int().min(0).max(10000).optional(),
});

export const hiveHubInspectionStartSchema = z.object({
  hives: z.array(hiveHubHiveIndexSchema).max(HIVEHUB_MAX_HIVES).optional(),
  note: z.string().max(1000).optional(),
  started_at: z.string().datetime({ offset: true }).optional(),
});

export const hiveHubInspectionStopSchema = z.object({
  note: z.string().max(1000).optional(),
  ended_at: z.string().datetime({ offset: true }).optional(),
});

export const hiveHubInspectionUpdateSchema = z.object({
  note: z.string().max(1000).nullable(),
});

export const hiveHubRecordingRequestSchema = z.object({
  hive: hiveHubHiveIndexSchema,
  /** Seconds, 1–60. The node stops at its own 60-second cap. */
  duration: z.coerce.number().min(1).max(60),
  gain_db: z.coerce.number().int().min(-20).max(20).optional(),
});

export const hiveHubMeasurementDeleteSchema = z
  .object({
    start_at: z.string().datetime({ offset: true }),
    end_at: z.string().datetime({ offset: true }),
    claim_code: z.string().trim().min(4).max(128),
  })
  .refine(body => new Date(body.end_at) >= new Date(body.start_at), {
    message: 'end_at must be at or after start_at',
    path: ['end_at'],
  });

export const hiveHubAlertSeveritySchema = z.enum([
  'info',
  'watch',
  'warning',
  'critical',
]);

/** Per-user email notification settings for HiveHub insight alerts. */
export const hiveHubAlertPreferencesSchema = z.object({
  enabled: z.boolean().default(false),
  /** Alerts below this severity are never emailed. */
  minSeverity: z.enum(['watch', 'warning', 'critical']).default('warning'),
});

export type HiveHubClaimDevice = z.infer<typeof hiveHubClaimDeviceSchema>;
export type HiveHubChannelsPatch = z.infer<typeof hiveHubChannelsPatchSchema>;
export type HiveHubTempcoSource = z.infer<typeof hiveHubTempcoSourceSchema>;
export type HiveHubHiveScaleCalibration = z.infer<
  typeof hiveHubHiveScaleCalibrationSchema
>;
export type HiveHubConfigPatch = z.infer<typeof hiveHubConfigPatchSchema>;
export type HiveHubTempCompensationFit = z.infer<
  typeof hiveHubTempCompensationFitSchema
>;
export type HiveHubCalibrationModeStart = z.infer<
  typeof hiveHubCalibrationModeStartSchema
>;
export type HiveHubShareDevice = z.infer<typeof hiveHubShareDeviceSchema>;
export type HiveHubMeasurementQuery = z.infer<
  typeof hiveHubMeasurementQuerySchema
>;
export type HiveHubInspectionStart = z.infer<
  typeof hiveHubInspectionStartSchema
>;
export type HiveHubInspectionStop = z.infer<typeof hiveHubInspectionStopSchema>;
export type HiveHubInspectionUpdate = z.infer<
  typeof hiveHubInspectionUpdateSchema
>;
export type HiveHubRecordingRequest = z.infer<
  typeof hiveHubRecordingRequestSchema
>;
export type HiveHubMeasurementDelete = z.infer<
  typeof hiveHubMeasurementDeleteSchema
>;
export type HiveHubAlertSeverity = z.infer<typeof hiveHubAlertSeveritySchema>;
export type HiveHubAlertPreferences = z.infer<
  typeof hiveHubAlertPreferencesSchema
>;
