import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type {
  HiveHubChannelsPatch,
  HiveHubConfigPatch,
  HiveHubTempCompensationFit,
} from 'shared-schemas';
import { apiClient } from '../client';

/**
 * Pull the backend message out of an Axios error so a toast shows e.g. "No
 * active hiveinside firmware release" instead of "Request failed with status
 * code 404".
 */
export function hiveHubErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const data = error.response?.data;
    const message =
      typeof data === 'object' && data !== null
        ? Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message
        : typeof data === 'string'
          ? data
          : undefined;
    return message || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export interface HiveScaleDevice {
  device_id: string;
  display_name: string | null;
  claimed_at: string | null;
  last_seen_at: string | null;
  last_firmware_version: string | null;
  role: 'owner' | 'admin' | 'viewer';
  channels: {
    scale_1: string | null;
    scale_2: string | null;
    /** Hive display names keyed by hive index ("1".."18"). */
    names?: Record<string, string> | null;
    /** HivePal hive id each hive index is linked to ("1".."18" -> id). */
    hive_ids?: Record<string, string> | null;
  };
}

// A single hive carried by one HiveScale ESP32. Firmware v0.20.0+ reports up to
// 18 hives per device (NAU7802 scales behind a TCA9548A mux, DS18B20 by ROM,
// per-hive BLE / accelerometer / bee-counter), delivered by the HiveScale
// backend as the `hives` array on every measurement (see `HiveScaleMeasurement`).
//
// The shape mirrors the backend `hive_readings` rows. For historical / legacy
// (pre-v0.20.0) rows the backend synthesizes hives 1–2 from the flat
// scale_N_*/hive_N_* columns, which carry a subset of these fields — so the
// nested sensor blocks and their members are all optional/nullable.
export interface HiveScaleHiveReading {
  index: number; // 1..18
  name?: string | null;
  weight_kg: number | null;
  raw_weight: number | null;
  scale_source?: string | null; // hx711 | nau7802 | hivescale_gatt | ...
  /** False when a configured scale produced no usable reading this cycle. */
  scale_ok?: boolean | null;
  temp_c: number | null;
  temp_source?: string | null; // ds18b20 | ble | hiveheart
  humidity_percent: number | null;
  accel?: {
    /** Set when the paired in-hive BLE node was heard this scan. */
    ok: boolean | null;
    sample_rate_hz?: number | null;
    sample_count?: number | null;
    range_g?: number | null;
    rms_mg: number | null;
    peak_mg: number | null;
    band_swarm_mg: number | null;
    band_fanning_mg: number | null;
    band_activity_mg: number | null;
  } | null;
  /** HiveInside in-hive audio metrics (the canonical HiveHub key). */
  mic?: HiveScaleHiveSound | null;
  sound?: {
    ok?: boolean | null;
    rms_dbfs?: number | null;
    peak_dbfs?: number | null;
    band_sub_bass_dbfs?: number | null;
    band_hum_dbfs?: number | null;
    band_piping_dbfs?: number | null;
    band_stress_dbfs?: number | null;
    band_high_dbfs?: number | null;
    frequency_hz?: number | null;
    energy?: number | null;
    peak?: number | null;
  } | null;
  hiveheart?: {
    present?: boolean | null;
    temp_c?: number | null;
    humidity_percent?: number | null;
    frequency_hz?: number | null;
    energy?: number | null;
    peak?: number | null;
    battery_v?: number | null;
    rssi_dbm?: number | null;
    /** 16 relative spectrum levels (0–15), decoded by HiveHub. */
    fft_bins?: number[] | null;
  } | null;
  hivescale?: {
    present?: boolean | null;
    weight_kg?: number | null;
    battery_v?: number | null;
    rssi_dbm?: number | null;
  } | null;
  ble?: {
    present?: boolean | null;
    sensor_type?: string | null; // HiveInside | RuuviTag | HolyIot 25015
    firmware_version?: string | null;
    board?: string | null;
    /** Advertised node name, e.g. "HiveInside-8A3F". */
    device_name?: string | null;
    mac?: string | null;
    humidity_percent: number | null;
    pressure_hpa: number | null;
    accel_x_mg?: number | null;
    accel_y_mg?: number | null;
    accel_z_mg?: number | null;
    battery_percent?: number | null;
    battery_mv?: number | null;
    rssi_dbm?: number | null;
  } | null;
  bee_counter?: {
    ok: boolean | null;
    device_name?: string | null;
    mac?: string | null;
    version?: string | null;
    protocol_version?: number | null;
    /** Bit 0x80 = night idle. */
    status_flags?: number | null;
    uptime_s?: number | null;
    num_gates?: number | null;
    /** How many of the three gate expanders answer (0..3). */
    mcps_healthy?: number | null;
    glitch_count?: number | null;
    /** Seconds until the night-mode window ends (wire rev 4+). */
    idle_s?: number | null;
    /** Emitter-bank bitmask the counter runs with (wire rev 5+). */
    banks?: number | null;
    total_in: number | null;
    total_out: number | null;
    interval_in: number | null;
    interval_out: number | null;
  } | null;
}

export interface HiveScaleHiveSound {
  ok?: boolean | null;
  rms_dbfs?: number | null;
  peak_dbfs?: number | null;
  band_sub_bass_dbfs?: number | null;
  band_hum_dbfs?: number | null;
  band_piping_dbfs?: number | null;
  band_stress_dbfs?: number | null;
  band_high_dbfs?: number | null;
}

export interface HiveScaleMeasurement {
  id: number;
  device_id: string;
  measured_at: string;
  received_at: string;
  scale_1_weight_kg: number | null;
  scale_2_weight_kg: number | null;
  // Temperature-compensated weights from the HiveScale backend. When
  // compensation is disabled these equal the raw weights and
  // tempco_applied is false, so they can be read unconditionally.
  scale_1_weight_kg_compensated?: number | null;
  scale_2_weight_kg_compensated?: number | null;
  tempco_applied?: boolean | null;
  hive_1_temp_c: number | null;
  hive_2_temp_c: number | null;
  ambient_temp_c: number | null;
  ambient_humidity_percent: number | null;
  battery_voltage: number | null;
  battery_voltage_v?: number | null;
  battery_soc_percent: number | null;
  battery_alert: boolean | null;
  battery_monitor_ok: boolean | null;
  solar_monitor_ok: boolean | null;
  solar_bus_voltage_v: number | null;
  solar_shunt_voltage_mv: number | null;
  solar_load_voltage_v: number | null;
  solar_current_ma: number | null;
  solar_power_mw: number | null;
  calibration_mode: boolean | null;
  boot_count: number | null;
  time_source: string | null;
  firmware_version: string | null;
  config_version: number | null;
  sd_ok: boolean | null;
  rtc_ok: boolean | null;
  sht_ok: boolean | null;
  scale_1_raw: number | null;
  scale_2_raw: number | null;
  // Microphone (INMP441 stereo)
  mic_ok: boolean | null;
  mic_sample_rate_hz: number | null;
  mic_sample_frames: number | null;
  mic_left_ok: boolean | null;
  mic_left_rms_dbfs: number | null;
  mic_left_peak_dbfs: number | null;
  mic_left_rms_normalized: number | null;
  mic_right_ok: boolean | null;
  mic_right_rms_dbfs: number | null;
  mic_right_peak_dbfs: number | null;
  mic_right_rms_normalized: number | null;
  // FFT band energy per channel (dBFS, arduinoFFT)
  mic_left_band_sub_bass_dbfs: number | null; //   50–150 Hz
  mic_left_band_hum_dbfs: number | null; // 150–300 Hz  (colony hum ~200 Hz)
  mic_left_band_piping_dbfs: number | null; // 300–550 Hz  (queen piping)
  mic_left_band_stress_dbfs: number | null; // 550–1500 Hz (agitated / robbing)
  mic_left_band_high_dbfs: number | null; // 1500–3000 Hz (harmonic overtones)
  mic_right_band_sub_bass_dbfs: number | null;
  mic_right_band_hum_dbfs: number | null;
  mic_right_band_piping_dbfs: number | null;
  mic_right_band_stress_dbfs: number | null;
  mic_right_band_high_dbfs: number | null;
  // BeeCounter entrance counter — channel 1
  bee_counter_1_ok: boolean | null;
  bee_counter_1_protocol_version: number | null;
  bee_counter_1_status_flags: number | null;
  bee_counter_1_uptime_s: number | null;
  bee_counter_1_num_gates: number | null;
  bee_counter_1_gates_healthy: number | null;
  bee_counter_1_total_in: number | null;
  bee_counter_1_total_out: number | null;
  bee_counter_1_interval_in: number | null;
  bee_counter_1_interval_out: number | null;
  bee_counter_1_glitch_count: number | null;
  bee_counter_1_busy_retries: number | null;
  bee_counter_1_read_attempts: number | null;
  bee_counter_1_latch_succeeded: boolean | null;
  // BeeCounter entrance counter — channel 2
  bee_counter_2_ok: boolean | null;
  bee_counter_2_protocol_version: number | null;
  bee_counter_2_status_flags: number | null;
  bee_counter_2_uptime_s: number | null;
  bee_counter_2_num_gates: number | null;
  bee_counter_2_gates_healthy: number | null;
  bee_counter_2_total_in: number | null;
  bee_counter_2_total_out: number | null;
  bee_counter_2_interval_in: number | null;
  bee_counter_2_interval_out: number | null;
  bee_counter_2_glitch_count: number | null;
  bee_counter_2_busy_retries: number | null;
  bee_counter_2_read_attempts: number | null;
  bee_counter_2_latch_succeeded: boolean | null;
  // Accelerometer (LIS3DH / LIS2DH12 per-hive vibration, mg, AC/gravity-removed)
  accel_1_ok: boolean | null;
  accel_1_sample_rate_hz: number | null;
  accel_1_sample_count: number | null;
  accel_1_range_g: number | null;
  accel_1_rms_mg: number | null;
  accel_1_peak_mg: number | null;
  accel_1_band_swarm_mg: number | null; //   8–30 Hz  (~20 Hz pre-swarm signal)
  accel_1_band_fanning_mg: number | null; //  30–100 Hz (fanning / ventilation)
  accel_1_band_activity_mg: number | null; // 100–200 Hz (general activity)
  accel_2_ok: boolean | null;
  accel_2_sample_rate_hz: number | null;
  accel_2_sample_count: number | null;
  accel_2_range_g: number | null;
  accel_2_rms_mg: number | null;
  accel_2_peak_mg: number | null;
  accel_2_band_swarm_mg: number | null;
  accel_2_band_fanning_mg: number | null;
  accel_2_band_activity_mg: number | null;
  // HolyIot 25015 in-hive BLE sensor (SHT40 + LPS22HB + LIS2DH12), bridged by
  // the ESP32 per hive. Temperature is delivered via hive_N_temp_c and the
  // per-hive acceleration via accel_N_*; humidity and barometric pressure are
  // promoted to their own columns. Battery/RSSI/raw axes are diagnostic.
  ble_1_humidity_percent: number | null;
  ble_1_pressure_hpa: number | null;
  ble_1_accel_x_mg: number | null;
  ble_1_accel_y_mg: number | null;
  ble_1_accel_z_mg: number | null;
  ble_1_battery_percent: number | null;
  ble_1_rssi_dbm: number | null;
  ble_2_humidity_percent: number | null;
  ble_2_pressure_hpa: number | null;
  ble_2_accel_x_mg: number | null;
  ble_2_accel_y_mg: number | null;
  ble_2_accel_z_mg: number | null;
  ble_2_battery_percent: number | null;
  ble_2_rssi_dbm: number | null;
  // Running firmware version reported by a HiveInside C6 in-hive sensor over
  // GATT ("fw"). Null for HolyIot/Ruuvi beacons and older payloads.
  ble_1_firmware_version: string | null;
  ble_2_firmware_version: string | null;
  // beehivemonitoring.com GATT sensors bridged by the ESP32 per hive. The
  // HiveHeart is an in-hive acoustic sensor (frequency/energy/peak + battery)
  // and the HiveScale is a wireless weight scale; both report a raw battery
  // voltage rather than a percentage. These come straight from the HiveScale
  // backend measurement payload.
  hiveheart_1_frequency_hz: number | null;
  hiveheart_1_energy: number | null;
  hiveheart_1_peak: number | null;
  hiveheart_1_battery_v: number | null;
  hiveheart_2_frequency_hz: number | null;
  hiveheart_2_energy: number | null;
  hiveheart_2_peak: number | null;
  hiveheart_2_battery_v: number | null;
  hivescale_1_battery_v: number | null;
  hivescale_2_battery_v: number | null;
  // Normalized per-hive readings — up to 18 hives per device (firmware v0.20.0+).
  // This is the source of truth for reading every hive; the flat scale_1/scale_2
  // (and hive_1/2, accel_1/2, ble_1/2, bee_counter_1/2) fields above remain as a
  // 1–2 mirror for legacy consumers. Backfilled from the legacy columns for old
  // rows, so it is present on every measurement (only `undefined` on the rare
  // row with no data at all).
  hives?: HiveScaleHiveReading[];
  // ── Hub status ──
  rssi_dbm?: number | null;
  network_transport?: string | null; // "wifi" | "cellular"
  hive_count?: number | null;
  // ── Inspection mode (readings taken while it is on are masked) ──
  inspection?: boolean | null;
  inspection_id?: number | null;
  inspection_hives?: number[] | null;
}

/**
 * Read one of the flat per-hive aliases HiveHub synthesizes for every hive
 * (`scale_7_weight_kg`, `hiveheart_3_fft_bins`, …), which the fixed interface
 * above only lists for hives 1–2.
 */
export function flatHiveField<T = number>(
  measurement: HiveScaleMeasurement | null | undefined,
  prefix: string,
  index: number,
  suffix: string,
): T | null {
  if (!measurement) return null;
  const value = (measurement as unknown as Record<string, unknown>)[
    `${prefix}_${index}_${suffix}`
  ];
  return value === undefined ? null : (value as T);
}

export type HiveScaleTempcoSource = 'ambient' | 'hive_1' | 'hive_2';

/** Calibration for hives 3..18 (hives 1–2 use the scale1/2_* fields). */
export interface HiveScaleHiveCalibration {
  index: number;
  scale?: number;
  offset: number;
  factor: number;
  tempco_kg_per_c: number;
}

export interface HiveScaleDeviceConfig {
  device_id: string;
  send_interval_seconds: number;
  scale1_offset: number;
  scale1_factor: number;
  scale2_offset: number;
  scale2_factor: number;
  hive_scales?: HiveScaleHiveCalibration[];
  config_version: number;
  // Load-cell temperature compensation (corrected in the HiveHub backend).
  tempco_enabled: boolean;
  tempco_source: HiveScaleTempcoSource;
  tempco_ref_temp_c: number;
  scale1_tempco_kg_per_c: number;
  scale2_tempco_kg_per_c: number;
  // HiveTraffic night mode (local minutes since midnight, POSIX TZ).
  beecounter_night_mode_enabled?: boolean;
  beecounter_night_start_minute?: number;
  beecounter_night_end_minute?: number;
  beecounter_night_max_traffic?: number;
  timezone?: string;
  // HiveTraffic emitter banks (gates 00–07, 10–17, 20–27).
  beecounter_bank1_enabled?: boolean;
  beecounter_bank2_enabled?: boolean;
  beecounter_bank3_enabled?: boolean;
  /** Safety net: an inspection ends by itself after this many minutes. */
  inspection_timeout_minutes?: number;
}

export interface ClaimHiveScaleDeviceInput {
  claim_code: string;
  display_name?: string;
  scale_1_display_name?: string;
  scale_2_display_name?: string;
}

export type HiveScaleConfigPatch = HiveHubConfigPatch;

export type HiveScaleTempCompensationFitInput = HiveHubTempCompensationFit;

export interface HiveScaleTempCompensationFitResult {
  ok: boolean;
  reason?: string;
  scale: number;
  temp_source: HiveScaleTempcoSource;
  applied: boolean;
  coeff_kg_per_c: number;
  ref_temp_c: number;
  intercept_kg?: number | null;
  r_squared: number | null;
  n: number;
  temp_min_c: number | null;
  temp_max_c: number | null;
  window_start?: string;
  window_end?: string;
}

export type HiveScaleChannelsPatch = HiveHubChannelsPatch;

export interface HiveScaleCalibrationModeStartInput {
  interval_seconds?: number;
  timeout_seconds?: number;
}

export interface HiveScaleShareInput {
  email: string;
  role: 'admin' | 'viewer';
}

export interface HiveScaleMember {
  user_id: string;
  email: string;
  name: string | null;
  role: 'owner' | 'admin' | 'viewer';
  invited_by: string | null;
  created_at: string | null;
}

export interface HiveScaleMeasurementQuery {
  limit?: number;
  start_at?: string;
  end_at?: string;
  /** Server-side down-sampling for wide chart ranges. */
  max_points?: number;
}

const DEFAULT_MEASUREMENT_QUERY: HiveScaleMeasurementQuery = { limit: 200 };

const HIVESCALE_KEYS = {
  all: ['hivescale'] as const,
  devices: () => [...HIVESCALE_KEYS.all, 'devices'] as const,
  config: (deviceId: string | undefined) =>
    [...HIVESCALE_KEYS.all, 'config', deviceId] as const,
  members: (deviceId: string | undefined) =>
    [...HIVESCALE_KEYS.all, 'members', deviceId] as const,
  measurements: (
    deviceId: string | undefined,
    query: HiveScaleMeasurementQuery | undefined,
  ) => [...HIVESCALE_KEYS.all, 'measurements', deviceId, query] as const,
  insights: (
    deviceId: string | undefined,
    query: HiveScaleInsightsQuery | undefined,
  ) => [...HIVESCALE_KEYS.all, 'insights', deviceId, query] as const,
  insightsSummary: (deviceId: string | undefined) =>
    [...HIVESCALE_KEYS.all, 'insightsSummary', deviceId] as const,
  insightsHistory: (
    deviceId: string | undefined,
    query: HiveScaleInsightsHistoryQuery | undefined,
  ) => [...HIVESCALE_KEYS.all, 'insightsHistory', deviceId, query] as const,
  firmwareStatus: (deviceId: string | undefined) =>
    [...HIVESCALE_KEYS.all, 'firmwareStatus', deviceId] as const,
  inspectionStatus: (deviceId: string | undefined) =>
    [...HIVESCALE_KEYS.all, 'inspectionStatus', deviceId] as const,
  inspections: (
    deviceId: string | undefined,
    query: HiveScaleInspectionsQuery | undefined,
  ) => [...HIVESCALE_KEYS.all, 'inspections', deviceId, query] as const,
  recordings: (deviceId: string | undefined, hive: number | undefined) =>
    [...HIVESCALE_KEYS.all, 'recordings', deviceId, hive] as const,
  exportSummary: (
    deviceId: string | undefined,
    query: HiveScaleExportQuery | undefined,
  ) => [...HIVESCALE_KEYS.all, 'exportSummary', deviceId, query] as const,
};

export { HIVESCALE_KEYS };

export const useHiveScaleDevices = (
  options: { enabled?: boolean; retry?: boolean } = {},
) => {
  return useQuery<HiveScaleDevice[]>({
    queryKey: HIVESCALE_KEYS.devices(),
    queryFn: async () => {
      const response = await apiClient.get<HiveScaleDevice[]>(
        '/api/hivescale/devices',
      );
      return response.data;
    },
    enabled: options.enabled ?? true,
    staleTime: 30000,
    ...(options.retry === false ? { retry: false } : {}),
  });
};

export const useHiveScaleDeviceConfig = (deviceId: string | undefined) => {
  return useQuery<HiveScaleDeviceConfig>({
    queryKey: HIVESCALE_KEYS.config(deviceId),
    queryFn: async () => {
      const response = await apiClient.get<HiveScaleDeviceConfig>(
        `/api/hivescale/devices/${deviceId}/config`,
      );
      return response.data;
    },
    enabled: !!deviceId,
  });
};

export const useHiveScaleMeasurements = (
  deviceId: string | undefined,
  query: HiveScaleMeasurementQuery = DEFAULT_MEASUREMENT_QUERY,
  options: { refetchInterval?: number | false } = {},
) => {
  return useQuery<HiveScaleMeasurement[]>({
    queryKey: HIVESCALE_KEYS.measurements(deviceId, query),
    queryFn: async () => {
      const response = await apiClient.get<HiveScaleMeasurement[]>(
        `/api/hivescale/devices/${deviceId}/measurements`,
        { params: query },
      );
      return response.data;
    },
    enabled: !!deviceId,
    refetchInterval: options.refetchInterval ?? 60000,
  });
};

export const useHiveScaleMembers = (
  deviceId: string | undefined,
  enabled = true,
) => {
  return useQuery<HiveScaleMember[]>({
    queryKey: HIVESCALE_KEYS.members(deviceId),
    queryFn: async () => {
      const response = await apiClient.get<HiveScaleMember[]>(
        `/api/hivescale/devices/${deviceId}/members`,
      );
      return response.data;
    },
    enabled: !!deviceId && enabled,
  });
};

export const useHiveScaleInsights = (
  deviceId: string | undefined,
  query: HiveScaleInsightsQuery = {},
  options: { refetchInterval?: number | false } = {},
) => {
  return useQuery<HiveScaleInsightsResponse>({
    queryKey: HIVESCALE_KEYS.insights(deviceId, query),
    queryFn: async () => {
      const response = await apiClient.get<HiveScaleInsightsResponse>(
        `/api/hivescale/devices/${deviceId}/insights`,
        {
          params:
            query.lookbackDays === undefined
              ? undefined
              : { lookback_days: query.lookbackDays },
        },
      );
      return response.data;
    },
    enabled: !!deviceId,
    refetchInterval: options.refetchInterval ?? 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });
};

export const useHiveScaleInsightsSummary = (
  deviceId: string | undefined,
  options: { refetchInterval?: number | false } = {},
) => {
  return useQuery<HiveScaleInsightsSummaryResponse>({
    queryKey: HIVESCALE_KEYS.insightsSummary(deviceId),
    queryFn: async () => {
      const response = await apiClient.get<HiveScaleInsightsSummaryResponse>(
        `/api/hivescale/devices/${deviceId}/insights/summary`,
      );
      return response.data;
    },
    enabled: !!deviceId,
    refetchInterval: options.refetchInterval ?? 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });
};

export const useHiveScaleInsightsHistory = (
  deviceId: string | undefined,
  query: HiveScaleInsightsHistoryQuery = {},
  options: { enabled?: boolean } = {},
) => {
  return useQuery<HiveScaleInsightsHistoryResponse>({
    queryKey: HIVESCALE_KEYS.insightsHistory(deviceId, query),
    queryFn: async () => {
      const params: Record<string, unknown> = {};
      if (query.status !== undefined) params.status = query.status;
      if (query.category !== undefined) params.category = query.category;
      if (query.since !== undefined) params.since = query.since;
      if (query.limit !== undefined) params.limit = query.limit;
      const response = await apiClient.get<HiveScaleInsightsHistoryResponse>(
        `/api/hivescale/devices/${deviceId}/insights/history`,
        { params: Object.keys(params).length > 0 ? params : undefined },
      );
      return response.data;
    },
    enabled: !!deviceId && (options.enabled ?? true),
    staleTime: 60 * 1000,
  });
};

export type HiveScaleInsightSeverity =
  | 'info'
  | 'watch'
  | 'warning'
  | 'critical';

export type HiveScaleInsightCategory =
  | 'swarm'
  | 'queenless'
  | 'robbing'
  | 'foraging'
  | 'brood'
  | 'decline'
  | 'winter'
  | 'harvest'
  | 'acoustic';

export interface HiveScaleInsightAlert {
  id: string;
  category: HiveScaleInsightCategory;
  severity: HiveScaleInsightSeverity;
  channel: number;
  title: string;
  description: string;
  window_start: string | null;
  window_end: string | null;
  confidence: number;
  evidence: Record<string, unknown>;
  source: string;
}

export interface HiveScaleInsightsResponse {
  device_id: string;
  computed_at: string;
  lookback_days: number;
  measurement_count: number;
  alerts: HiveScaleInsightAlert[];
}

export interface HiveScaleInsightsSummaryResponse {
  device_id: string;
  computed_at: string;
  alert_count: number;
  highest_severity: HiveScaleInsightSeverity | null;
  highest_alert: HiveScaleInsightAlert | null;
  categories: HiveScaleInsightCategory[];
}

export interface HiveScaleInsightsQuery {
  lookbackDays?: number;
}

export type HiveScaleInsightStatus = 'active' | 'resolved';

/**
 * A persisted insight alert occurrence with its lifecycle. Returned by the
 * history endpoint. Distinct from the live `HiveScaleInsightAlert` in that it
 * carries first/last-seen and resolution timestamps.
 */
export interface HiveScaleInsightHistoryEntry {
  id: number;
  alert_key: string;
  category: HiveScaleInsightCategory;
  channel: number;
  severity: HiveScaleInsightSeverity;
  peak_severity: HiveScaleInsightSeverity;
  title: string;
  description: string;
  confidence: number;
  evidence: Record<string, unknown>;
  source: string;
  window_start: string | null;
  window_end: string | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
  resolved_at: string | null;
  status: HiveScaleInsightStatus;
  update_count: number;
}

export interface HiveScaleInsightsHistoryResponse {
  device_id: string;
  lookback_days: number;
  count: number;
  active_count: number;
  alerts: HiveScaleInsightHistoryEntry[];
}

export interface HiveScaleInsightsHistoryQuery {
  status?: 'all' | HiveScaleInsightStatus;
  category?: HiveScaleInsightCategory;
  since?: string;
  limit?: number;
}

export const useClaimHiveScaleDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClaimHiveScaleDeviceInput) => {
      const response = await apiClient.post(
        '/api/hivescale/devices/claim',
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HIVESCALE_KEYS.devices() });
    },
  });
};

/** What the backend reports after removing a membership. */
export interface HiveScaleDeviceRemovalResult {
  status: string;
  device_id: string;
  /**
   * True when that was the last member, so the device was unclaimed and its
   * claim code pairs it again. False when other members still hold it.
   */
  released?: boolean;
}

export const useRemoveHiveScaleDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await apiClient.delete<HiveScaleDeviceRemovalResult>(
        `/api/hivescale/devices/${deviceId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HIVESCALE_KEYS.devices() });
    },
  });
};

/**
 * Owner-only "forget this device": removes every member and unclaims it in one
 * step, so it can be re-paired with its claim code. Removing yourself only
 * releases the device once you are the last member left.
 */
export const useReleaseHiveScaleDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await apiClient.delete<{
        status: string;
        device_id: string;
        members_removed: number;
      }>(`/api/hivescale/devices/${deviceId}/claim`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HIVESCALE_KEYS.devices() });
    },
  });
};

export const useUpdateHiveScaleConfig = (deviceId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HiveScaleConfigPatch) => {
      const response = await apiClient.patch<HiveScaleDeviceConfig>(
        `/api/hivescale/devices/${deviceId}/config`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: HIVESCALE_KEYS.config(deviceId),
      });
    },
  });
};

export const useFitHiveScaleTempCompensation = (
  deviceId: string | undefined,
) => {
  const queryClient = useQueryClient();

  return useMutation<
    HiveScaleTempCompensationFitResult,
    Error,
    HiveScaleTempCompensationFitInput
  >({
    mutationFn: async data => {
      const response = await apiClient.post<HiveScaleTempCompensationFitResult>(
        `/api/hivescale/devices/${deviceId}/temp-compensation/fit`,
        data,
      );
      return response.data;
    },
    onSuccess: result => {
      // A successful applied fit writes the coefficient back to the config, so
      // refresh it. Measurements gain new compensated values too.
      if (result.applied) {
        queryClient.invalidateQueries({
          queryKey: HIVESCALE_KEYS.config(deviceId),
        });
        queryClient.invalidateQueries({ queryKey: HIVESCALE_KEYS.all });
      }
    },
  });
};

export const useUpdateHiveScaleChannels = (deviceId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HiveScaleChannelsPatch) => {
      const response = await apiClient.patch(
        `/api/hivescale/devices/${deviceId}/channels`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HIVESCALE_KEYS.devices() });
    },
  });
};

export const useShareHiveScaleDevice = (deviceId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HiveScaleShareInput) => {
      const response = await apiClient.post(
        `/api/hivescale/devices/${deviceId}/members`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: HIVESCALE_KEYS.members(deviceId),
      });
    },
  });
};

export const useRevokeHiveScaleMember = (deviceId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberUserId: string) => {
      const response = await apiClient.delete(
        `/api/hivescale/devices/${deviceId}/members/${memberUserId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: HIVESCALE_KEYS.members(deviceId),
      });
    },
  });
};

export const useStartHiveScaleCalibrationMode = (
  deviceId: string | undefined,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HiveScaleCalibrationModeStartInput = {}) => {
      const response = await apiClient.post(
        `/api/hivescale/devices/${deviceId}/calibration/start`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: HIVESCALE_KEYS.config(deviceId),
      });
    },
  });
};

export const useStopHiveScaleCalibrationMode = (
  deviceId: string | undefined,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(
        `/api/hivescale/devices/${deviceId}/calibration/stop`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: HIVESCALE_KEYS.config(deviceId),
      });
    },
  });
};

// 'hivehub' is the new name for the main-board firmware target (formerly
// 'hivescale'). The HiveHub backend accepts the 'hivehub' alias; the legacy
// 'hivescale' value stays valid for older clients.
export type HiveScaleFirmwareTarget =
  | 'hivehub'
  | 'hivescale'
  | 'beecounter'
  | 'hiveinside';

export type HiveScaleFirmwareBoard = 'esp32' | 'esp32-c6' | 'nrf54lm20a';

export interface HiveScaleFirmwareUploadInput {
  file: File;
  version: string;
  target: HiveScaleFirmwareTarget;
  /** Omit to let HiveHub take the board from the filename. */
  board?: HiveScaleFirmwareBoard;
  active?: boolean;
}

export interface HiveScaleAutoQueuedUpdate {
  slot: number;
  status: 'queued' | 'failed';
  command_id?: number;
  error?: string;
}

export interface HiveScaleFirmwareUploadResult {
  status: string;
  version: string;
  filename: string;
  target: HiveScaleFirmwareTarget;
  active: boolean;
  size_bytes: number;
  crc32: number;
  /**
   * For HiveInside uploads, the backend also queues the OTA relay to every hive
   * that reports a HiveInside node. One entry per slot; absent for other targets.
   */
  auto_queued_updates?: HiveScaleAutoQueuedUpdate[];
}

export interface HiveScaleSdImportResult {
  status: string;
  device_id: string;
  /** Records parsed out of the uploaded file. */
  parsed: number;
  /** Non-empty lines that could not be parsed as JSON. */
  skipped: number;
  /** Records forwarded to the HiveScale backend. */
  received: number;
  /** New measurement rows actually stored. */
  inserted: number;
  /** Rows ignored as duplicates (already stored or repeated in the file). */
  duplicates: number;
}

/**
 * Thrown when the SD file was recorded by a different hub than the selected
 * one. The caller can ask the user and retry with `force: true`.
 */
export class HiveScaleSdDeviceMismatchError extends Error {
  constructor(
    message: string,
    readonly fileDeviceIds: string[],
  ) {
    super(message);
    this.name = 'HiveScaleSdDeviceMismatchError';
  }
}

export interface HiveScaleSdImportInput {
  file: File;
  /** Import even though the file names a different device. */
  force?: boolean;
}

export const useImportHiveScaleSdData = (deviceId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<HiveScaleSdImportResult, Error, HiveScaleSdImportInput>({
    mutationFn: async ({ file, force }) => {
      const formData = new FormData();
      // The apiClient request interceptor strips Content-Type for FormData so
      // the browser sets the multipart boundary itself.
      formData.append('file', file);
      if (force) formData.append('force', 'true');

      try {
        const response = await apiClient.post<HiveScaleSdImportResult>(
          `/api/hivescale/devices/${deviceId}/measurements/import`,
          formData,
        );
        return response.data;
      } catch (error) {
        // Surface the backend message (e.g. "No measurements found…") instead
        // of Axios' generic "Request failed with status code 400" so callers
        // that toast error.message show actionable feedback.
        if (
          isAxiosError<{ code?: string; file_device_ids?: string[] }>(error) &&
          error.response?.status === 409 &&
          error.response.data?.code === 'device_mismatch'
        ) {
          throw new HiveScaleSdDeviceMismatchError(
            hiveHubErrorMessage(error, 'SD import failed'),
            error.response.data.file_device_ids ?? [],
          );
        }
        throw new Error(hiveHubErrorMessage(error, 'SD import failed'));
      }
    },
    onSuccess: () => {
      // New historical measurements affect the charts and latest-value panels.
      queryClient.invalidateQueries({ queryKey: HIVESCALE_KEYS.all });
    },
  });
};

export const useUploadHiveScaleFirmware = (deviceId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<
    HiveScaleFirmwareUploadResult,
    Error,
    HiveScaleFirmwareUploadInput
  >({
    mutationFn: async ({ file, version, target, board, active = true }) => {
      const formData = new FormData();
      // Field order/names must match the FastAPI File()/Form() parameters.
      formData.append('file', file);
      formData.append('version', version);
      formData.append('target', target);
      if (board) formData.append('board', board);
      formData.append('active', String(active));

      // The apiClient request interceptor strips Content-Type for FormData so
      // the browser sets the multipart boundary itself.
      try {
        const response = await apiClient.post<HiveScaleFirmwareUploadResult>(
          `/api/hivescale/devices/${deviceId}/firmware`,
          formData,
        );
        return response.data;
      } catch (error) {
        throw new Error(hiveHubErrorMessage(error, 'Firmware upload failed'));
      }
    },
    onSuccess: () => {
      // last_firmware_version is surfaced in the devices list, so refresh it.
      queryClient.invalidateQueries({ queryKey: HIVESCALE_KEYS.devices() });
      queryClient.invalidateQueries({
        queryKey: HIVESCALE_KEYS.firmwareStatus(deviceId),
      });
    },
  });
};

export interface HiveScaleFirmwareStatus {
  device_id: string;
  target: string;
  current_version: string | null;
  latest_version: string | null;
  /** True when the latest available release is a global/official build (no owner). */
  latest_is_official: boolean;
  approved_version: string | null;
  update_available: boolean;
  /** Update available but not yet approved — the device will not auto-flash. */
  pending_approval: boolean;
  /** Board the hub reports (esp32 / esp32-c6). */
  device_board?: string | null;
  /** Newer releases uploaded for a different board than this hub's. */
  other_board_releases?: Array<{ version: string; board: string }>;
  hiveinside_latest_version?: string | null;
  /** Last HiveInside relay attempt per hive slot ("1".."18"). */
  hiveinside_relays?: Record<string, HiveScaleRelayStatus>;
  beecounter_latest_version?: string | null;
  /** Last HiveTraffic relay attempt per hive slot ("1".."18"). */
  beecounter_relays?: Record<string, HiveScaleRelayStatus>;
}

export interface HiveScaleRelayStatus {
  status: string; // pending | running | completed | failed | expired
  message: string | null;
  version: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export interface HiveScaleFirmwareApproveResult {
  status: string;
  device_id: string;
  version: string;
  command_id: number;
}

export const useHiveScaleFirmwareStatus = (
  deviceId: string | undefined,
  options: { enabled?: boolean } = {},
) => {
  return useQuery<HiveScaleFirmwareStatus>({
    queryKey: HIVESCALE_KEYS.firmwareStatus(deviceId),
    queryFn: async () => {
      const response = await apiClient.get<HiveScaleFirmwareStatus>(
        `/api/hivescale/devices/${deviceId}/firmware/status`,
      );
      return response.data;
    },
    enabled: !!deviceId && (options.enabled ?? true),
    staleTime: 60 * 1000,
  });
};

export const useApproveHiveScaleFirmware = (deviceId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<HiveScaleFirmwareApproveResult, Error, void>({
    mutationFn: async () => {
      try {
        const response = await apiClient.post<HiveScaleFirmwareApproveResult>(
          `/api/hivescale/devices/${deviceId}/firmware/approve`,
        );
        return response.data;
      } catch (error) {
        // Surface the backend message (e.g. "No firmware release available…")
        // instead of Axios' generic status-code string.
        if (isAxiosError<{ message?: string }>(error)) {
          const data = error.response?.data;
          const message =
            (typeof data === 'object' && data !== null
              ? data.message
              : typeof data === 'string'
                ? data
                : undefined) ?? error.message;
          throw new Error(message || 'Firmware approval failed');
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Approval flips pending_approval and queues an update; refresh both the
      // status notice and the devices list (last_firmware_version).
      queryClient.invalidateQueries({
        queryKey: HIVESCALE_KEYS.firmwareStatus(deviceId),
      });
      queryClient.invalidateQueries({ queryKey: HIVESCALE_KEYS.devices() });
    },
  });
};

export interface HiveScaleRelayUpdateResult {
  status: string;
  id: number;
  command_type: string;
  payload: { slot: number };
  version?: string | null;
  current_version?: string | null;
}

export interface HiveScaleRelayUpdateInput {
  slot: number;
  /** Relay even when the node already runs this version or newer. */
  force?: boolean;
}

const useQueueRelayUpdate = (
  deviceId: string | undefined,
  command: 'update-hiveinside' | 'update-beecounter',
  fallback: string,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    HiveScaleRelayUpdateResult,
    Error,
    HiveScaleRelayUpdateInput
  >({
    mutationFn: async ({ slot, force }) => {
      try {
        const response = await apiClient.post<HiveScaleRelayUpdateResult>(
          `/api/hivescale/devices/${deviceId}/commands/${command}`,
          null,
          { params: { slot, ...(force ? { force: true } : {}) } },
        );
        return response.data;
      } catch (error) {
        throw new Error(hiveHubErrorMessage(error, fallback));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: HIVESCALE_KEYS.firmwareStatus(deviceId),
      });
    },
  });
};

/**
 * Queue a HiveInside OTA relay for the node paired with the given hive.
 *
 * Uploading a HiveInside binary only *registers* the release; this makes the
 * hub download it and relay it to the node over BLE. HiveHub refuses (409) a
 * relay that is not newer than what the node runs unless `force` is set.
 */
export const useQueueHiveInsideUpdate = (deviceId: string | undefined) =>
  useQueueRelayUpdate(
    deviceId,
    'update-hiveinside',
    'Failed to queue HiveInside OTA',
  );

/**
 * Queue a HiveTraffic counter OTA relay for the given hive. The counter stops
 * counting for the duration of the transfer.
 */
export const useQueueBeeCounterUpdate = (deviceId: string | undefined) =>
  useQueueRelayUpdate(
    deviceId,
    'update-beecounter',
    'Failed to queue HiveTraffic OTA',
  );

// ── Remote setup access point ──────────────────────────────────────────────

/**
 * Ask the hub to open its setup access point. Queued: the AP appears after the
 * hub's next check-in, up to one send interval later.
 */
export const useStartHiveScaleProvisioning = (deviceId: string | undefined) =>
  useMutation<{ status: string; id: number }, Error, void>({
    mutationFn: async () => {
      try {
        const response = await apiClient.post<{ status: string; id: number }>(
          `/api/hivescale/devices/${deviceId}/provisioning/start`,
        );
        return response.data;
      } catch (error) {
        throw new Error(
          hiveHubErrorMessage(error, 'Could not queue AP mode for the hub'),
        );
      }
    },
  });

// ── Inspection mode ────────────────────────────────────────────────────────

export interface HiveScaleInspection {
  id: number;
  device_id: string;
  /** Hive indexes the inspection covers; null/empty means the whole hub. */
  hives: number[] | null;
  started_at: string;
  ended_at: string | null;
  active: boolean;
  source: 'device' | 'api' | 'dashboard' | string;
  end_reason: string | null;
  requested_at: string | null;
  acknowledged_at: string | null;
  note: string | null;
  created_by: string | null;
}

export interface HiveScaleInspectionStatus {
  device_id: string;
  active: boolean;
  /** Requested from the app but not yet picked up by the hub. */
  pending: boolean;
  inspection: HiveScaleInspection | null;
  timeout_minutes: number;
}

export interface HiveScaleInspectionsQuery {
  start_at?: string;
  end_at?: string;
  limit?: number;
}

export interface HiveScaleInspectionStartInput {
  hives?: number[];
  note?: string;
}

export const useHiveScaleInspectionStatus = (
  deviceId: string | undefined,
  options: { refetchInterval?: number | false; enabled?: boolean } = {},
) =>
  useQuery<HiveScaleInspectionStatus>({
    queryKey: HIVESCALE_KEYS.inspectionStatus(deviceId),
    queryFn: async () => {
      const response = await apiClient.get<HiveScaleInspectionStatus>(
        `/api/hivescale/devices/${deviceId}/inspections/status`,
      );
      return response.data;
    },
    enabled: !!deviceId && (options.enabled ?? true),
    refetchInterval: options.refetchInterval ?? 30000,
  });

export const useHiveScaleInspections = (
  deviceId: string | undefined,
  query: HiveScaleInspectionsQuery = {},
  options: { enabled?: boolean } = {},
) =>
  useQuery<HiveScaleInspection[]>({
    queryKey: HIVESCALE_KEYS.inspections(deviceId, query),
    queryFn: async () => {
      const response = await apiClient.get<HiveScaleInspection[]>(
        `/api/hivescale/devices/${deviceId}/inspections`,
        { params: query },
      );
      return response.data;
    },
    enabled: !!deviceId && (options.enabled ?? true),
    staleTime: 30000,
  });

const useInspectionMutation = <TInput>(
  deviceId: string | undefined,
  request: (input: TInput) => Promise<unknown>,
  fallback: string,
) => {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, TInput>({
    mutationFn: async input => {
      try {
        return await request(input);
      } catch (error) {
        throw new Error(hiveHubErrorMessage(error, fallback));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: HIVESCALE_KEYS.inspectionStatus(deviceId),
      });
      queryClient.invalidateQueries({
        queryKey: [...HIVESCALE_KEYS.all, 'inspections', deviceId],
      });
    },
  });
};

/** Start inspection mode: the hub masks readings until it is stopped. */
export const useStartHiveScaleInspection = (deviceId: string | undefined) =>
  useInspectionMutation<HiveScaleInspectionStartInput>(
    deviceId,
    async input =>
      (
        await apiClient.post(
          `/api/hivescale/devices/${deviceId}/inspections/start`,
          input,
        )
      ).data,
    'Could not start inspection mode',
  );

export const useStopHiveScaleInspection = (deviceId: string | undefined) =>
  useInspectionMutation<{ note?: string }>(
    deviceId,
    async input =>
      (
        await apiClient.post(
          `/api/hivescale/devices/${deviceId}/inspections/stop`,
          input,
        )
      ).data,
    'Could not stop inspection mode',
  );

export const useUpdateHiveScaleInspection = (deviceId: string | undefined) =>
  useInspectionMutation<{ id: number; note: string | null }>(
    deviceId,
    async ({ id, note }) =>
      (
        await apiClient.patch(
          `/api/hivescale/devices/${deviceId}/inspections/${id}`,
          { note },
        )
      ).data,
    'Could not save the inspection note',
  );

// ── Hive audio recordings ──────────────────────────────────────────────────

export type HiveScaleRecordingStatus =
  | 'requested'
  | 'streaming'
  | 'ready'
  | 'failed';

export interface HiveScaleRecording {
  id: number;
  device_id: string;
  hive_index: number;
  status: HiveScaleRecordingStatus;
  requested_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  requested_duration_s: number | null;
  gain_db: number | null;
  sample_rate: number | null;
  bytes: number | null;
  seconds: number | null;
  /** Audio the node itself lost. */
  dropped_bytes: number | null;
  /** Sequence gaps on the air. */
  gaps: number | null;
  /** Notifications the hub's staging buffer could not take. */
  ring_overruns: number | null;
  ring_dropped_bytes: number | null;
  clipped_pct: number | null;
  complete: boolean | null;
  crc_ok: boolean | null;
  confirmation: 'verified' | 'reported' | 'confirmed' | 'unknown' | string;
  hub_message: string | null;
  error: string | null;
  requested_by: string | null;
}

export interface HiveScaleRecordingRequestInput {
  hive: number;
  /** Seconds, 1–60. */
  duration: number;
  gain_db?: number;
}

/** Same-origin URL of a recording's WAV; the session cookie authorizes it. */
export const hiveScaleRecordingWavUrl = (recordingId: number) =>
  `/api/hivescale/recordings/${recordingId}/audio.wav`;

export const useHiveScaleRecordings = (
  deviceId: string | undefined,
  hive?: number,
  options: { refetchInterval?: number | false; enabled?: boolean } = {},
) =>
  useQuery<HiveScaleRecording[]>({
    queryKey: HIVESCALE_KEYS.recordings(deviceId, hive),
    queryFn: async () => {
      const response = await apiClient.get<{
        recordings: HiveScaleRecording[];
      }>(`/api/hivescale/devices/${deviceId}/recordings`, {
        params: hive ? { hive, limit: 50 } : { limit: 50 },
      });
      return response.data.recordings ?? [];
    },
    enabled: !!deviceId && (options.enabled ?? true),
    refetchInterval: options.refetchInterval,
  });

export const useRequestHiveScaleRecording = (deviceId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation<HiveScaleRecording, Error, HiveScaleRecordingRequestInput>(
    {
      mutationFn: async input => {
        try {
          const response = await apiClient.post<HiveScaleRecording>(
            `/api/hivescale/devices/${deviceId}/recordings`,
            null,
            { params: input },
          );
          return response.data;
        } catch (error) {
          throw new Error(
            hiveHubErrorMessage(error, 'Could not request a recording'),
          );
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [...HIVESCALE_KEYS.all, 'recordings', deviceId],
        });
      },
    },
  );
};

export const useDeleteHiveScaleRecording = (deviceId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, number>({
    mutationFn: async recordingId => {
      try {
        return (
          await apiClient.delete(`/api/hivescale/recordings/${recordingId}`)
        ).data;
      } catch (error) {
        throw new Error(
          hiveHubErrorMessage(error, 'Could not delete the recording'),
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...HIVESCALE_KEYS.all, 'recordings', deviceId],
      });
    },
  });
};

// ── Data export / range delete ─────────────────────────────────────────────

export interface HiveScaleExportQuery {
  start_at?: string;
  end_at?: string;
}

export interface HiveScaleExportSummary {
  devices: Array<{
    device_id: string;
    measurements: number;
    first_measured_at: string | null;
    last_measured_at: string | null;
  }>;
  total_measurements: number;
  filename: string;
}

export const useHiveScaleExportSummary = (
  deviceId: string | undefined,
  query: HiveScaleExportQuery = {},
  options: { enabled?: boolean } = {},
) =>
  useQuery<HiveScaleExportSummary>({
    queryKey: HIVESCALE_KEYS.exportSummary(deviceId, query),
    queryFn: async () => {
      const response = await apiClient.get<HiveScaleExportSummary>(
        `/api/hivescale/devices/${deviceId}/export/measurements/summary`,
        { params: query },
      );
      return response.data;
    },
    enabled: !!deviceId && (options.enabled ?? true),
  });

/**
 * Same-origin download URL for the NDJSON backup. A plain navigation, so the
 * browser streams it to disk instead of buffering it in memory.
 */
export const hiveScaleExportUrl = (
  deviceId: string,
  query: HiveScaleExportQuery & { hive?: number[] } = {},
) => {
  const params = new URLSearchParams();
  if (query.start_at) params.set('start_at', query.start_at);
  if (query.end_at) params.set('end_at', query.end_at);
  for (const hive of query.hive ?? []) params.append('hive', String(hive));
  const qs = params.toString();
  return `/api/hivescale/devices/${encodeURIComponent(deviceId)}/export/measurements${qs ? `?${qs}` : ''}`;
};

export interface HiveScaleMeasurementDeleteInput {
  start_at: string;
  end_at: string;
  claim_code: string;
}

export const useDeleteHiveScaleMeasurements = (
  deviceId: string | undefined,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    { status: string; deleted: number },
    Error,
    HiveScaleMeasurementDeleteInput
  >({
    mutationFn: async input => {
      try {
        const response = await apiClient.post<{
          status: string;
          deleted: number;
        }>(`/api/hivescale/devices/${deviceId}/measurements/delete`, input);
        return response.data;
      } catch (error) {
        throw new Error(
          hiveHubErrorMessage(error, 'Could not delete the readings'),
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HIVESCALE_KEYS.all });
    },
  });
};
