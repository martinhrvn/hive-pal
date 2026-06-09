import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { apiClient } from '../client';

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
  };
}

export interface HiveScaleMeasurement {
  id: number;
  device_id: string;
  measured_at: string;
  received_at: string;
  scale_1_weight_kg: number | null;
  scale_2_weight_kg: number | null;
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
  mic_left_band_sub_bass_dbfs: number | null;   //   50–150 Hz
  mic_left_band_hum_dbfs: number | null;         // 150–300 Hz  (colony hum ~200 Hz)
  mic_left_band_piping_dbfs: number | null;      // 300–550 Hz  (queen piping)
  mic_left_band_stress_dbfs: number | null;      // 550–1500 Hz (agitated / robbing)
  mic_left_band_high_dbfs: number | null;        // 1500–3000 Hz (harmonic overtones)
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
}

export interface HiveScaleDeviceConfig {
  device_id: string;
  send_interval_seconds: number;
  scale1_offset: number;
  scale1_factor: number;
  scale2_offset: number;
  scale2_factor: number;
  config_version: number;
}

export interface ClaimHiveScaleDeviceInput {
  claim_code: string;
  display_name?: string;
  scale_1_display_name?: string;
  scale_2_display_name?: string;
}

export interface HiveScaleConfigPatch {
  send_interval_seconds?: number;
  scale1_offset?: number;
  scale1_factor?: number;
  scale2_offset?: number;
  scale2_factor?: number;
}

export interface HiveScaleChannelsPatch {
  scale_1_display_name?: string;
  scale_2_display_name?: string;
}

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
};

export const useHiveScaleDevices = () => {
  return useQuery<HiveScaleDevice[]>({
    queryKey: HIVESCALE_KEYS.devices(),
    queryFn: async () => {
      const response = await apiClient.get<HiveScaleDevice[]>(
        '/api/hivescale/devices',
      );
      return response.data;
    },
    staleTime: 30000,
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
  | 'harvest';

export interface HiveScaleInsightAlert {
  id: string;
  category: HiveScaleInsightCategory;
  severity: HiveScaleInsightSeverity;
  channel: 1 | 2;
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
  channel: 1 | 2;
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
      const response = await apiClient.post('/api/hivescale/devices/claim', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HIVESCALE_KEYS.devices() });
    },
  });
};

export const useRemoveHiveScaleDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await apiClient.delete(`/api/hivescale/devices/${deviceId}`);
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
      queryClient.invalidateQueries({ queryKey: HIVESCALE_KEYS.config(deviceId) });
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
      queryClient.invalidateQueries({ queryKey: HIVESCALE_KEYS.members(deviceId) });
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
      queryClient.invalidateQueries({ queryKey: HIVESCALE_KEYS.members(deviceId) });
    },
  });
};

export const useStartHiveScaleCalibrationMode = (deviceId: string | undefined) => {
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
      queryClient.invalidateQueries({ queryKey: HIVESCALE_KEYS.config(deviceId) });
    },
  });
};

export const useStopHiveScaleCalibrationMode = (deviceId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(
        `/api/hivescale/devices/${deviceId}/calibration/stop`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HIVESCALE_KEYS.config(deviceId) });
    },
  });
};

export type HiveScaleFirmwareTarget = 'hivescale' | 'beecounter';

export interface HiveScaleFirmwareUploadInput {
  file: File;
  version: string;
  target: HiveScaleFirmwareTarget;
  active?: boolean;
}

export interface HiveScaleFirmwareUploadResult {
  status: string;
  version: string;
  filename: string;
  target: HiveScaleFirmwareTarget;
  active: boolean;
  size_bytes: number;
  crc32: number;
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

export const useImportHiveScaleSdData = (deviceId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<HiveScaleSdImportResult, Error, File>({
    mutationFn: async file => {
      const formData = new FormData();
      // The apiClient request interceptor strips Content-Type for FormData so
      // the browser sets the multipart boundary itself.
      formData.append('file', file);

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
        if (isAxiosError<{ message?: string }>(error)) {
          const data = error.response?.data;
          const message =
            (typeof data === 'object' && data !== null
              ? data.message
              : typeof data === 'string'
                ? data
                : undefined) ?? error.message;
          throw new Error(message || 'SD import failed');
        }
        throw error;
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

  return useMutation<HiveScaleFirmwareUploadResult, Error, HiveScaleFirmwareUploadInput>({
    mutationFn: async ({ file, version, target, active = true }) => {
      const formData = new FormData();
      // Field order/names must match the FastAPI File()/Form() parameters.
      formData.append('file', file);
      formData.append('version', version);
      formData.append('target', target);
      formData.append('active', String(active));

      // The apiClient request interceptor strips Content-Type for FormData so
      // the browser sets the multipart boundary itself.
      const response = await apiClient.post<HiveScaleFirmwareUploadResult>(
        `/api/hivescale/devices/${deviceId}/firmware`,
        formData,
      );
      return response.data;
    },
    onSuccess: () => {
      // last_firmware_version is surfaced in the devices list, so refresh it.
      queryClient.invalidateQueries({ queryKey: HIVESCALE_KEYS.devices() });
    },
  });
};
