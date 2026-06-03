import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, Method } from 'axios';
import FormData from 'form-data';
import { UsersService } from '../users/users.service';

export interface HiveScaleFirmwareUploadDto {
  version: string;
  target?: 'hivescale' | 'beecounter';
  active?: boolean;
}

export interface HiveScaleFirmwareUploadResult {
  status: string;
  version: string;
  filename: string;
  target: 'hivescale' | 'beecounter';
  active: boolean;
  size_bytes: number;
  crc32: number;
}

export interface HiveScaleClaimDeviceDto {
  claim_code: string;
  display_name?: string;
  scale_1_display_name?: string;
  scale_2_display_name?: string;
}

export interface HiveScaleConfigPatchDto {
  send_interval_seconds?: number;
  scale1_offset?: number;
  scale1_factor?: number;
  scale2_offset?: number;
  scale2_factor?: number;
}

export interface HiveScaleChannelsPatchDto {
  scale_1_display_name?: string;
  scale_2_display_name?: string;
}

export interface HiveScaleShareDeviceDto {
  email: string;
  role: 'admin' | 'viewer';
}

export interface HiveScaleMeasurementQuery {
  limit?: number;
  start_at?: string;
  end_at?: string;
}

export interface HiveScaleCalibrationModeStartDto {
  interval_seconds?: number;
  timeout_seconds?: number;
}

interface HiveScaleMember {
  user_id: string;
  role: 'owner' | 'admin' | 'viewer';
  invited_by: string | null;
  created_at: string | null;
}

@Injectable()
export class HiveScaleService {
  private readonly baseUrl: string;
  private readonly serviceApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.baseUrl = (
      this.configService.get<string>('HIVESCALE_API_BASE_URL') ?? ''
    )
      .trim()
      .replace(/\/$/, '');
    this.serviceApiKey = (
      this.configService.get<string>('HIVESCALE_SERVICE_API_KEY') ?? ''
    ).trim();
  }

  private requireBaseUrl(): string {
    if (!this.baseUrl) {
      throw new InternalServerErrorException(
        'HIVESCALE_API_BASE_URL is not configured on the HivePal backend',
      );
    }
    return this.baseUrl;
  }

  private requireServiceApiKey(): string {
    if (!this.serviceApiKey) {
      throw new InternalServerErrorException(
        'HIVESCALE_SERVICE_API_KEY is not configured on the HivePal backend',
      );
    }
    return this.serviceApiKey;
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
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-HivePal-Service-Key': this.requireServiceApiKey(),
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.handleAxiosError(error);
      }
      throw new BadGatewayException('HiveScale backend request failed');
    }
  }

  private handleAxiosError(error: AxiosError): never {
    if (error.response) {
      const responseData = error.response.data as
        | { detail?: string; message?: string }
        | string
        | undefined;
      const message =
        typeof responseData === 'string'
          ? responseData
          : responseData?.detail ||
            responseData?.message ||
            'HiveScale backend error';

      throw new HttpException(message, error.response.status);
    }

    throw new BadGatewayException('HiveScale backend is unavailable');
  }

  claimDevice(accessToken: string, payload: HiveScaleClaimDeviceDto) {
    return this.request(accessToken, 'POST', '/api/v1/app/devices/claim', {
      data: payload,
    });
  }

  listDevices(accessToken: string) {
    return this.request(accessToken, 'GET', '/api/v1/app/devices');
  }

  removeDevice(accessToken: string, deviceId: string) {
    return this.request(accessToken, 'DELETE', `/api/v1/app/devices/${deviceId}`);
  }

  getDeviceConfig(accessToken: string, deviceId: string) {
    return this.request(
      accessToken,
      'GET',
      `/api/v1/app/devices/${deviceId}/config`,
    );
  }

  updateDeviceConfig(
    accessToken: string,
    deviceId: string,
    payload: HiveScaleConfigPatchDto,
  ) {
    return this.request(
      accessToken,
      'PATCH',
      `/api/v1/app/devices/${deviceId}/config`,
      {
        data: payload,
      },
    );
  }

  updateDeviceChannels(
    accessToken: string,
    deviceId: string,
    payload: HiveScaleChannelsPatchDto,
  ) {
    return this.request(
      accessToken,
      'PATCH',
      `/api/v1/app/devices/${deviceId}/channels`,
      {
        data: payload,
      },
    );
  }

  startCalibrationMode(
    accessToken: string,
    deviceId: string,
    payload: HiveScaleCalibrationModeStartDto,
  ) {
    return this.request(
      accessToken,
      'POST',
      `/api/v1/app/devices/${deviceId}/calibration/start`,
      { data: payload },
    );
  }

  stopCalibrationMode(accessToken: string, deviceId: string) {
    return this.request(
      accessToken,
      'POST',
      `/api/v1/app/devices/${deviceId}/calibration/stop`,
    );
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

    const target = dto.target ?? 'hivescale';
    if (target !== 'hivescale' && target !== 'beecounter') {
      throw new BadRequestException(
        "target must be 'hivescale' or 'beecounter'",
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
    // FastAPI Form(bool) accepts the string "true"/"false".
    form.append('active', String(dto.active ?? true));

    try {
      const response = await axios.request<HiveScaleFirmwareUploadResult>({
        baseURL: this.requireBaseUrl(),
        url: `/api/v1/app/devices/${deviceId}/firmware`,
        method: 'POST',
        data: form,
        // Firmware images can be a few MB; allow a generous timeout and no
        // body-size cap on the proxy hop.
        timeout: 120000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${accessToken}`,
          'X-HivePal-Service-Key': this.requireServiceApiKey(),
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.handleAxiosError(error);
      }
      throw new BadGatewayException('HiveScale firmware upload failed');
    }
  }

  listMeasurements(
    accessToken: string,
    deviceId: string,
    query: HiveScaleMeasurementQuery,
  ) {
    return this.request(
      accessToken,
      'GET',
      `/api/v1/app/devices/${deviceId}/measurements`,
      { params: query as Record<string, unknown> },
    );
  }

  latestMeasurements(accessToken: string, deviceId: string, limit?: number) {
    return this.request(
      accessToken,
      'GET',
      `/api/v1/app/devices/${deviceId}/measurements/latest`,
      { params: { limit } },
    );
  }

  getDeviceInsights(
    accessToken: string,
    deviceId: string,
    lookbackDays?: number,
  ) {
    return this.request(
      accessToken,
      'GET',
      `/api/v1/app/devices/${deviceId}/insights`,
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
      `/api/v1/app/devices/${deviceId}/insights/summary`,
    );
  }

  async listMembers(accessToken: string, deviceId: string) {
    const members = await this.request<HiveScaleMember[]>(
      accessToken,
      'GET',
      `/api/v1/app/devices/${deviceId}/members`,
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
    payload: HiveScaleShareDeviceDto,
  ) {
    const email = payload.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException(`No HivePal user found for ${email}`);
    }

    return this.request(
      accessToken,
      'POST',
      `/api/v1/app/devices/${deviceId}/members`,
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
      `/api/v1/app/devices/${deviceId}/members/${encodeURIComponent(memberUserId)}`,
    );
  }
}
