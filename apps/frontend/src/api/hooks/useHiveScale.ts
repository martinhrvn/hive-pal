import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

export interface HiveScaleDevice {
  device_id: string;
  display_name: string | null;
  claimed_at: string | null;
  last_seen_at: string | null;
  last_firmware_version: string | null;
  role: 'owner' | 'admin' | 'viewer';
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
  rssi_dbm: number | null;
  firmware_version: string | null;
  config_version: number | null;
  sd_ok: boolean | null;
  rtc_ok: boolean | null;
  sht_ok: boolean | null;
  scale_1_raw: number | null;
  scale_2_raw: number | null;
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
}

export interface HiveScaleConfigPatch {
  send_interval_seconds?: number;
  scale1_offset?: number;
  scale1_factor?: number;
  scale2_offset?: number;
  scale2_factor?: number;
}

export interface HiveScaleMeasurementQuery {
  limit?: number;
  start_at?: string;
  end_at?: string;
}

const HIVESCALE_KEYS = {
  all: ['hivescale'] as const,
  devices: () => [...HIVESCALE_KEYS.all, 'devices'] as const,
  config: (deviceId: string | undefined) =>
    [...HIVESCALE_KEYS.all, 'config', deviceId] as const,
  measurements: (
    deviceId: string | undefined,
    query: HiveScaleMeasurementQuery | undefined,
  ) => [...HIVESCALE_KEYS.all, 'measurements', deviceId, query] as const,
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
  query: HiveScaleMeasurementQuery = { limit: 200 },
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
    refetchInterval: 60000,
  });
};

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
