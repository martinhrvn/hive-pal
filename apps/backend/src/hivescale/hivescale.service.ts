import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios, { AxiosError, Method } from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';
import type {
  HiveHubCalibrationModeStart,
  HiveHubChannelsPatch,
  HiveHubClaimDevice,
  HiveHubConfigPatch,
  HiveHubInspectionStart,
  HiveHubInspectionStop,
  HiveHubInspectionUpdate,
  HiveHubMeasurementDelete,
  HiveHubMeasurementQuery,
  HiveHubRecordingRequest,
  HiveHubShareDevice,
  HiveHubTempCompensationFit,
} from 'shared-schemas';
import { UsersService } from '../users/users.service';
import { deviceIdsInRecords, parseSdMeasurements } from './sd-import.parser';

// The HiveHub backend accepts up to 20k measurements per import request; we
// forward the parsed SD file in chunks no larger than this so a multi-month
// download (tens of thousands of rows) is split into several requests.
const SD_IMPORT_CHUNK_SIZE = 5000;

export interface HiveScaleSdImportResult {
  status: string;
  device_id: string;
  /** Records parsed out of the uploaded file. */
  parsed: number;
  /** Non-empty lines that could not be parsed as JSON. */
  skipped: number;
  /** Records forwarded to the HiveHub backend. */
  received: number;
  /** New measurement rows actually stored. */
  inserted: number;
  /** Rows ignored because they already existed (or repeated in the file). */
  duplicates: number;
}

interface HiveScaleImportResponse {
  status: string;
  device_id: string;
  received: number;
  inserted: number;
  duplicates: number;
}

// 'hivehub' is the new name for the main-board firmware target (formerly
// 'hivescale'). The HiveHub backend accepts the 'hivehub' alias and normalizes
// it back to 'hivescale' internally, so we forward whichever value the client
// sends and keep accepting the legacy 'hivescale' value too.
export const HIVEHUB_FIRMWARE_TARGETS = [
  'hivehub',
  'hivescale',
  'beecounter',
  'hiveinside',
] as const;
export type HiveScaleFirmwareTarget = (typeof HIVEHUB_FIRMWARE_TARGETS)[number];

// Boards the HiveHub backend knows (server/firmware.py). Empty lets HiveHub
// derive the board from the filename or fall back to its default.
export const HIVEHUB_FIRMWARE_BOARDS = [
  'esp32',
  'esp32-c6',
  'nrf54lm20a',
] as const;
export type HiveScaleFirmwareBoard = (typeof HIVEHUB_FIRMWARE_BOARDS)[number];

export interface HiveScaleFirmwareUploadDto {
  version: string;
  target?: HiveScaleFirmwareTarget;
  board?: HiveScaleFirmwareBoard;
  active?: boolean;
}

export interface HiveScaleRelayUpdateResult {
  status: string;
  id: number;
  command_type: string;
  payload: { slot: number };
  version?: string | null;
  current_version?: string | null;
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
   * When a HiveInside image is uploaded as the active release, HivePal also
   * queues the OTA relay to every hive that reports a HiveInside node, so that
   * uploading and updating are a single action. One entry per slot; omitted for
   * non-HiveInside uploads and inactive releases.
   */
  auto_queued_updates?: HiveScaleAutoQueuedUpdate[];
}

export interface HiveScaleRelayStatus {
  status: string;
  message: string | null;
  version: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export interface HiveScaleFirmwareStatus {
  device_id: string;
  target: string;
  current_version: string | null;
  latest_version: string | null;
  /** True when the latest available release is a global/official build (no owner). */
  latest_is_official: boolean;
  approved_version: string | null;
  update_available: boolean;
  /** Update available but not yet approved by the owner — the device won't auto-flash. */
  pending_approval: boolean;
  device_board?: string | null;
  other_board_releases?: unknown[];
  hiveinside_latest_version?: string | null;
  hiveinside_relays?: Record<string, HiveScaleRelayStatus>;
  beecounter_latest_version?: string | null;
  beecounter_relays?: Record<string, HiveScaleRelayStatus>;
}

export interface HiveScaleFirmwareApproveResult {
  status: string;
  device_id: string;
  version: string;
  command_id: number;
}

export interface HiveHubDevice {
  device_id: string;
  display_name: string | null;
  claimed_at: string | null;
  last_seen_at: string | null;
  last_firmware_version: string | null;
  role: 'owner' | 'admin' | 'viewer';
  channels?: {
    scale_1?: string | null;
    scale_2?: string | null;
    names?: Record<string, string>;
    hive_ids?: Record<string, string>;
  };
}

export interface HiveHubInsightHistoryAlert {
  id: number;
  alert_key: string;
  category: string;
  channel: number | null;
  severity: string;
  peak_severity: string;
  title: string;
  description: string;
  confidence: number;
  first_seen_at: string | null;
  last_seen_at: string | null;
  resolved_at: string | null;
  status: 'active' | 'resolved';
}

export interface HiveHubInsightHistory {
  device_id?: string;
  count?: number;
  active_count?: number;
  alerts: HiveHubInsightHistoryAlert[];
}

/** A streamed response from HiveHub (audio, NDJSON export). */
export interface HiveHubStream {
  stream: Readable;
  contentType: string;
  contentLength?: string;
  contentDisposition?: string;
}

/** The claims HiveHub reads from the forwarded token (it only needs `sub`). */
export interface HiveHubTokenUser {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  passwordChangeRequired?: boolean;
}

interface HiveScaleMember {
  user_id: string;
  role: 'owner' | 'admin' | 'viewer';
  invited_by: string | null;
  created_at: string | null;
}

interface HiveHubLatestMeasurement {
  hives?: Array<{
    index?: number;
    ble?: { present?: boolean; sensor_type?: string; board?: string };
  }>;
}

/**
 * Hive slots that report a HiveInside node in the latest measurement. Falls back
 * to the two legacy slots when the device sends no per-hive data (pre-0.20
 * firmware), which is what HivePal always queued before.
 */
export function hiveInsideSlots(
  latest: HiveHubLatestMeasurement | undefined,
): number[] {
  const hives = latest?.hives;
  if (!hives || hives.length === 0) return [1, 2];
  return hives
    .filter((hive) => {
      const ble = hive.ble;
      if (!ble || ble.present === false) return false;
      return (
        /hiveinside/i.test(ble.sensor_type ?? '') ||
        /nrf54/i.test(ble.board ?? '')
      );
    })
    .map((hive) => Number(hive.index))
    .filter((index) => Number.isInteger(index) && index >= 1)
    .sort((a, b) => a - b);
}

@Injectable()
export class HiveScaleService {
  private readonly baseUrl: string;
  private readonly serviceApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    // HiveScale was renamed to HiveHub. Prefer the new HIVEHUB_* variables but
    // keep accepting the legacy HIVESCALE_* names so existing deployments keep
    // working without a config change. firstConfigured() skips empty values so
    // a blank HIVEHUB_* (e.g. passed through unset by docker-compose) still
    // falls back to a populated HIVESCALE_*.
    this.baseUrl = this.firstConfigured(
      'HIVEHUB_API_BASE_URL',
      'HIVESCALE_API_BASE_URL',
    ).replace(/\/$/, '');
    this.serviceApiKey = this.firstConfigured(
      'HIVEHUB_SERVICE_API_KEY',
      'HIVESCALE_SERVICE_API_KEY',
    );
  }

  /** True when both the HiveHub URL and service key are configured. */
  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.serviceApiKey);
  }

  /**
   * Sign the token HiveHub expects for a HivePal user. HiveHub verifies it with
   * the shared JWT secret and takes the user from `sub`; the session cookie the
   * browser sent is never forwarded.
   */
  tokenFor(user: HiveHubTokenUser): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name ?? null,
      passwordChangeRequired: user.passwordChangeRequired ?? false,
    });
  }

  /** Return the first env var that is set to a non-empty (trimmed) value. */
  private firstConfigured(...keys: string[]): string {
    for (const key of keys) {
      const value = (this.configService.get<string>(key) ?? '').trim();
      if (value) {
        return value;
      }
    }
    return '';
  }

  private requireBaseUrl(): string {
    if (!this.baseUrl) {
      throw new InternalServerErrorException(
        'HIVEHUB_API_BASE_URL (or legacy HIVESCALE_API_BASE_URL) is not configured on the HivePal backend',
      );
    }
    return this.baseUrl;
  }

  private requireServiceApiKey(): string {
    if (!this.serviceApiKey) {
      throw new InternalServerErrorException(
        'HIVEHUB_SERVICE_API_KEY (or legacy HIVESCALE_SERVICE_API_KEY) is not configured on the HivePal backend',
      );
    }
    return this.serviceApiKey;
  }

  private authHeaders(accessToken: string) {
    return {
      Authorization: `Bearer ${accessToken}`,
      'X-HivePal-Service-Key': this.requireServiceApiKey(),
    };
  }

  private async request<T>(
    accessToken: string,
    method: Method,
    path: string,
    options: { data?: unknown; params?: Record<string, unknown> } = {},
  ): Promise<T> {
    try {
      const response = await axios.request<T>({
        baseURL: this.requireBaseUrl(),
        url: path,
        method,
        data: options.data,
        params: options.params,
        // Repeated query keys (`hive=1&hive=2`) rather than `hive[]=1`.
        paramsSerializer: { indexes: null },
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          ...this.authHeaders(accessToken),
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.handleAxiosError(error);
      }
      throw new BadGatewayException('HiveHub backend request failed');
    }
  }

  /** GET a binary/streamed HiveHub response and hand the stream back. */
  private async requestStream(
    accessToken: string,
    path: string,
    params?: Record<string, unknown>,
  ): Promise<HiveHubStream> {
    try {
      const response = await axios.request<Readable>({
        baseURL: this.requireBaseUrl(),
        url: path,
        method: 'GET',
        params,
        paramsSerializer: { indexes: null },
        responseType: 'stream',
        // A long export streams for a while; this bounds the wait for headers.
        timeout: 120000,
        headers: this.authHeaders(accessToken),
      });
      const header = (name: string) => {
        const value: unknown = response.headers[name];
        return typeof value === 'string' ? value : undefined;
      };
      return {
        stream: response.data,
        contentType: header('content-type') ?? 'application/octet-stream',
        contentLength: header('content-length'),
        contentDisposition: header('content-disposition'),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // The body of an errored stream request is itself a stream; read it so
        // the upstream `detail` still reaches the user.
        const data: unknown = error.response?.data;
        if (error.response && data instanceof Readable) {
          const chunks: Buffer[] = [];
          for await (const chunk of data) {
            chunks.push(Buffer.from(chunk as Buffer));
          }
          const text = Buffer.concat(chunks).toString('utf8');
          try {
            error.response.data = JSON.parse(text) as unknown;
          } catch {
            error.response.data = text;
          }
        }
        this.handleAxiosError(error);
      }
      throw new BadGatewayException('HiveHub backend request failed');
    }
  }

  private handleAxiosError(error: AxiosError): never {
    if (error.response) {
      const responseData = error.response.data as
        | { detail?: unknown; message?: string }
        | string
        | undefined;
      const detail =
        typeof responseData === 'string'
          ? responseData
          : (responseData?.detail ?? responseData?.message);
      // FastAPI validation errors carry `detail` as a list of issues.
      const message =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail
                .map((issue: { msg?: string }) => issue?.msg)
                .filter(Boolean)
                .join('; ') || 'HiveHub backend error'
            : 'HiveHub backend error';

      throw new HttpException(message, error.response.status);
    }

    throw new BadGatewayException('HiveHub backend is unavailable');
  }

  private devicePath(deviceId: string, suffix = ''): string {
    return `/api/v1/app/devices/${encodeURIComponent(deviceId)}${suffix}`;
  }

  // ── Devices ──────────────────────────────────────────────────────────────

  claimDevice(accessToken: string, payload: HiveHubClaimDevice) {
    return this.request(accessToken, 'POST', '/api/v1/app/devices/claim', {
      data: payload,
    });
  }

  listDevices(accessToken: string) {
    return this.request<HiveHubDevice[]>(
      accessToken,
      'GET',
      '/api/v1/app/devices',
    );
  }

  removeDevice(accessToken: string, deviceId: string) {
    return this.request(accessToken, 'DELETE', this.devicePath(deviceId));
  }

  /**
   * Owner-only "forget this device": drops every member and unclaims it, so the
   * claim code pairs it again. `removeDevice` only removes the caller, which
   * leaves a shared device claimed until each member happens to remove
   * themselves.
   */
  releaseDevice(accessToken: string, deviceId: string) {
    return this.request(
      accessToken,
      'DELETE',
      this.devicePath(deviceId, '/claim'),
    );
  }

  getDeviceConfig(accessToken: string, deviceId: string) {
    return this.request(
      accessToken,
      'GET',
      this.devicePath(deviceId, '/config'),
    );
  }

  updateDeviceConfig(
    accessToken: string,
    deviceId: string,
    payload: HiveHubConfigPatch,
  ) {
    return this.request(
      accessToken,
      'PATCH',
      this.devicePath(deviceId, '/config'),
      { data: payload },
    );
  }

  fitTempCompensation(
    accessToken: string,
    deviceId: string,
    payload: HiveHubTempCompensationFit,
  ) {
    return this.request(
      accessToken,
      'POST',
      this.devicePath(deviceId, '/temp-compensation/fit'),
      { data: payload },
    );
  }

  getDeviceChannels(accessToken: string, deviceId: string) {
    return this.request(
      accessToken,
      'GET',
      this.devicePath(deviceId, '/channels'),
    );
  }

  updateDeviceChannels(
    accessToken: string,
    deviceId: string,
    payload: HiveHubChannelsPatch,
  ) {
    return this.request(
      accessToken,
      'PATCH',
      this.devicePath(deviceId, '/channels'),
      { data: payload },
    );
  }

  startCalibrationMode(
    accessToken: string,
    deviceId: string,
    payload: HiveHubCalibrationModeStart,
  ) {
    return this.request(
      accessToken,
      'POST',
      this.devicePath(deviceId, '/calibration/start'),
      { data: payload },
    );
  }

  stopCalibrationMode(accessToken: string, deviceId: string) {
    return this.request(
      accessToken,
      'POST',
      this.devicePath(deviceId, '/calibration/stop'),
    );
  }

  /** Open the hub's setup access point on its next check-in. */
  startProvisioning(accessToken: string, deviceId: string) {
    return this.request(
      accessToken,
      'POST',
      this.devicePath(deviceId, '/provisioning/start'),
    );
  }

  // ── Firmware ─────────────────────────────────────────────────────────────

  queueHiveInsideUpdate(
    accessToken: string,
    deviceId: string,
    slot: number,
    force = false,
  ) {
    return this.request<HiveScaleRelayUpdateResult>(
      accessToken,
      'POST',
      this.devicePath(deviceId, '/commands/update-hiveinside'),
      { params: { slot, force } },
    );
  }

  queueBeeCounterUpdate(
    accessToken: string,
    deviceId: string,
    slot: number,
    force = false,
  ) {
    return this.request<HiveScaleRelayUpdateResult>(
      accessToken,
      'POST',
      this.devicePath(deviceId, '/commands/update-beecounter'),
      { params: { slot, force } },
    );
  }

  /**
   * Queue the HiveInside OTA relay for every hive that reports a HiveInside
   * node, best-effort. Used after a HiveInside firmware upload so a published
   * release is pushed to the in-hive sensors without a separate manual step.
   * HiveHub refuses a relay that is not newer than what the node runs (409);
   * that is reported per slot rather than failing the upload.
   */
  private async queueHiveInsideUpdateAllSlots(
    accessToken: string,
    deviceId: string,
  ): Promise<HiveScaleAutoQueuedUpdate[]> {
    let slots: number[];
    try {
      const latest = await this.latestMeasurements<HiveHubLatestMeasurement[]>(
        accessToken,
        deviceId,
        1,
      );
      slots = hiveInsideSlots(latest[0]);
    } catch {
      slots = [1, 2];
    }

    const results: HiveScaleAutoQueuedUpdate[] = [];
    for (const slot of slots) {
      try {
        const queued = await this.queueHiveInsideUpdate(
          accessToken,
          deviceId,
          slot,
        );
        results.push({ slot, status: 'queued', command_id: queued.id });
      } catch (error) {
        results.push({
          slot,
          status: 'failed',
          error:
            error instanceof Error
              ? error.message
              : 'Failed to queue HiveInside update',
        });
      }
    }
    return results;
  }

  async uploadFirmware(
    accessToken: string,
    deviceId: string,
    file: Express.Multer.File,
    dto: HiveScaleFirmwareUploadDto,
  ): Promise<HiveScaleFirmwareUploadResult> {
    const version = (dto.version ?? '').trim();
    if (!version) {
      throw new BadRequestException('version is required');
    }

    const target = dto.target ?? 'hivehub';
    if (!HIVEHUB_FIRMWARE_TARGETS.includes(target)) {
      throw new BadRequestException(
        "target must be 'hivehub', 'beecounter' or 'hiveinside'",
      );
    }

    const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype || 'application/octet-stream',
      knownLength: file.size,
    });
    form.append('version', version);
    form.append('target', target);
    // Empty lets HiveHub take the board from the filename (hivehub_esp32-c6_…)
    // or fall back to its default.
    form.append('board', dto.board ?? '');
    // FastAPI Form(bool) accepts the string "true"/"false".
    form.append('active', String(dto.active ?? true));

    try {
      const response = await axios.request<HiveScaleFirmwareUploadResult>({
        baseURL: this.requireBaseUrl(),
        url: this.devicePath(deviceId, '/firmware'),
        method: 'POST',
        data: form,
        // Firmware images can be a few MB; the size is capped by the upload
        // interceptor, so the proxy hop itself needs no body-size limit.
        timeout: 120000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        headers: {
          ...form.getHeaders(),
          ...this.authHeaders(accessToken),
        },
      });

      const result = response.data;

      // Uploading a HiveInside image only *registers* the release on HiveHub;
      // the OTA relay has to be queued separately. Do that right away for every
      // node on this hub so that publishing a build also pushes it. Only for an
      // *active* release: a relay sends the latest active release, so an
      // inactive upload would otherwise relay an older build.
      if (result.target === 'hiveinside' && result.active) {
        result.auto_queued_updates = await this.queueHiveInsideUpdateAllSlots(
          accessToken,
          deviceId,
        );
      }

      return result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.handleAxiosError(error);
      }
      throw new BadGatewayException('HiveHub firmware upload failed');
    }
  }

  getFirmwareStatus(accessToken: string, deviceId: string) {
    return this.request<HiveScaleFirmwareStatus>(
      accessToken,
      'GET',
      this.devicePath(deviceId, '/firmware/status'),
    );
  }

  approveFirmware(accessToken: string, deviceId: string) {
    return this.request<HiveScaleFirmwareApproveResult>(
      accessToken,
      'POST',
      this.devicePath(deviceId, '/firmware/approve'),
    );
  }

  // ── Measurements ─────────────────────────────────────────────────────────

  async importSdMeasurements(
    accessToken: string,
    deviceId: string,
    file: Express.Multer.File,
    options: { force?: boolean } = {},
  ): Promise<HiveScaleSdImportResult> {
    const { records, skipped } = parseSdMeasurements(
      file.buffer,
      file.originalname,
    );

    if (records.length === 0) {
      throw new BadRequestException(
        'No measurements found in the uploaded file. Expected a HiveHub .ndjson backup or the .tar SD download.',
      );
    }

    // Every record is pinned to the selected device below, so a card pulled
    // from a different hub would silently attach its readings to this one.
    // The firmware stamps each line with the device that recorded it; refuse a
    // mismatch unless the user confirmed it.
    const otherDevices = deviceIdsInRecords(records).filter(
      (id) => id !== deviceId,
    );
    if (otherDevices.length > 0 && !options.force) {
      throw new ConflictException({
        statusCode: 409,
        code: 'device_mismatch',
        message: `This file was recorded by ${otherDevices.join(', ')}, not ${deviceId}.`,
        target_device_id: deviceId,
        file_device_ids: otherDevices,
      });
    }

    // Pin every record to the selected device so the upload cannot smuggle in
    // readings for a device the user does not own (the backend re-checks too).
    const measurements = records.map((record) => ({
      ...record,
      device_id: deviceId,
    }));

    let received = 0;
    let inserted = 0;
    let duplicates = 0;

    for (let i = 0; i < measurements.length; i += SD_IMPORT_CHUNK_SIZE) {
      const chunk = measurements.slice(i, i + SD_IMPORT_CHUNK_SIZE);
      const result = await this.request<HiveScaleImportResponse>(
        accessToken,
        'POST',
        this.devicePath(deviceId, '/measurements/import'),
        { data: { measurements: chunk } },
      );
      received += result.received;
      inserted += result.inserted;
      duplicates += result.duplicates;
    }

    return {
      status: 'ok',
      device_id: deviceId,
      parsed: records.length,
      skipped,
      received,
      inserted,
      duplicates,
    };
  }

  listMeasurements(
    accessToken: string,
    deviceId: string,
    query: HiveHubMeasurementQuery,
  ) {
    return this.request(
      accessToken,
      'GET',
      this.devicePath(deviceId, '/measurements'),
      { params: query as Record<string, unknown> },
    );
  }

  latestMeasurements<T = unknown>(
    accessToken: string,
    deviceId: string,
    limit?: number,
  ) {
    return this.request<T>(
      accessToken,
      'GET',
      this.devicePath(deviceId, '/measurements/latest'),
      { params: { limit } },
    );
  }

  deleteMeasurements(
    accessToken: string,
    deviceId: string,
    payload: HiveHubMeasurementDelete,
  ) {
    return this.request(
      accessToken,
      'POST',
      this.devicePath(deviceId, '/measurements/delete'),
      { data: payload },
    );
  }

  exportSummary(
    accessToken: string,
    deviceId: string,
    query: { start_at?: string; end_at?: string },
  ) {
    return this.request(
      accessToken,
      'GET',
      this.devicePath(deviceId, '/export/measurements/summary'),
      { params: query },
    );
  }

  exportMeasurements(
    accessToken: string,
    deviceId: string,
    query: { start_at?: string; end_at?: string; hive?: number[] },
  ) {
    return this.requestStream(
      accessToken,
      this.devicePath(deviceId, '/export/measurements'),
      query,
    );
  }

  // ── Insights ─────────────────────────────────────────────────────────────

  getDeviceInsights(
    accessToken: string,
    deviceId: string,
    lookbackDays?: number,
  ) {
    return this.request(
      accessToken,
      'GET',
      this.devicePath(deviceId, '/insights'),
      {
        params:
          lookbackDays !== undefined
            ? { lookback_days: lookbackDays }
            : undefined,
      },
    );
  }

  getDeviceInsightsSummary(accessToken: string, deviceId: string) {
    return this.request(
      accessToken,
      'GET',
      this.devicePath(deviceId, '/insights/summary'),
    );
  }

  getDeviceInsightsHistory(
    accessToken: string,
    deviceId: string,
    query: {
      status?: 'all' | 'active' | 'resolved';
      category?: string;
      since?: string;
      limit?: number;
    } = {},
  ) {
    const params: Record<string, unknown> = {};
    if (query.status !== undefined) params.status = query.status;
    if (query.category !== undefined) params.category = query.category;
    if (query.since !== undefined) params.since = query.since;
    if (query.limit !== undefined) params.limit = query.limit;
    return this.request<HiveHubInsightHistory>(
      accessToken,
      'GET',
      this.devicePath(deviceId, '/insights/history'),
      { params: Object.keys(params).length > 0 ? params : undefined },
    );
  }

  // ── Inspection mode ──────────────────────────────────────────────────────

  getInspectionStatus(accessToken: string, deviceId: string) {
    return this.request(
      accessToken,
      'GET',
      this.devicePath(deviceId, '/inspections/status'),
    );
  }

  listInspections(
    accessToken: string,
    deviceId: string,
    query: { start_at?: string; end_at?: string; limit?: number },
  ) {
    return this.request(
      accessToken,
      'GET',
      this.devicePath(deviceId, '/inspections'),
      { params: query },
    );
  }

  startInspection(
    accessToken: string,
    deviceId: string,
    payload: HiveHubInspectionStart,
  ) {
    return this.request(
      accessToken,
      'POST',
      this.devicePath(deviceId, '/inspections/start'),
      { data: payload },
    );
  }

  stopInspection(
    accessToken: string,
    deviceId: string,
    payload: HiveHubInspectionStop,
  ) {
    return this.request(
      accessToken,
      'POST',
      this.devicePath(deviceId, '/inspections/stop'),
      { data: payload },
    );
  }

  updateInspection(
    accessToken: string,
    deviceId: string,
    inspectionId: number,
    payload: HiveHubInspectionUpdate,
  ) {
    return this.request(
      accessToken,
      'PATCH',
      this.devicePath(deviceId, `/inspections/${inspectionId}`),
      { data: payload },
    );
  }

  // ── Hive audio recordings ────────────────────────────────────────────────

  listRecordings(
    accessToken: string,
    deviceId: string,
    query: { hive?: number; limit?: number },
  ) {
    return this.request(
      accessToken,
      'GET',
      this.devicePath(deviceId, '/recordings'),
      { params: query },
    );
  }

  requestRecording(
    accessToken: string,
    deviceId: string,
    query: HiveHubRecordingRequest,
  ) {
    return this.request(
      accessToken,
      'POST',
      this.devicePath(deviceId, '/recordings'),
      { params: query },
    );
  }

  getRecording(accessToken: string, recordingId: number) {
    return this.request(
      accessToken,
      'GET',
      `/api/v1/app/recordings/${recordingId}`,
    );
  }

  recordingWav(accessToken: string, recordingId: number) {
    return this.requestStream(
      accessToken,
      `/api/v1/app/recordings/${recordingId}/audio.wav`,
    );
  }

  deleteRecording(accessToken: string, recordingId: number) {
    return this.request(
      accessToken,
      'DELETE',
      `/api/v1/app/recordings/${recordingId}`,
    );
  }

  // ── Members ──────────────────────────────────────────────────────────────

  async listMembers(accessToken: string, deviceId: string) {
    const members = await this.request<HiveScaleMember[]>(
      accessToken,
      'GET',
      this.devicePath(deviceId, '/members'),
    );

    return Promise.all(
      members.map(async (member) => {
        const hivePalUser = await this.usersService.findById(member.user_id);
        return {
          ...member,
          email: hivePalUser?.email ?? member.user_id,
          name: hivePalUser?.name ?? null,
        };
      }),
    );
  }

  async shareDevice(
    accessToken: string,
    deviceId: string,
    payload: HiveHubShareDevice,
  ) {
    const email = payload.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException(`No HivePal user found for ${email}`);
    }

    return this.request(
      accessToken,
      'POST',
      this.devicePath(deviceId, '/members'),
      {
        data: {
          user_id: user.id,
          role: payload.role,
        },
      },
    );
  }

  revokeMember(accessToken: string, deviceId: string, memberUserId: string) {
    return this.request(
      accessToken,
      'DELETE',
      this.devicePath(deviceId, `/members/${encodeURIComponent(memberUserId)}`),
    );
  }
}
