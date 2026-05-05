import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, Method } from 'axios';

export interface HiveScaleClaimDeviceDto {
  claim_code: string;
  display_name?: string;
}

export interface HiveScaleConfigPatchDto {
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

@Injectable()
export class HiveScaleService {
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = (this.configService.get<string>('HIVESCALE_API_BASE_URL') ?? '')
      .trim()
      .replace(/\/$/, '');
  }

  private requireBaseUrl(): string {
    if (!this.baseUrl) {
      throw new InternalServerErrorException(
        'HIVESCALE_API_BASE_URL is not configured on the HivePal backend',
      );
    }
    return this.baseUrl;
  }

  private async request<T>(
    userId: string,
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
          'X-User-Id': userId,
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
          : responseData?.detail || responseData?.message || 'HiveScale backend error';

      throw new HttpException(message, error.response.status);
    }

    throw new BadGatewayException('HiveScale backend is unavailable');
  }

  claimDevice(userId: string, payload: HiveScaleClaimDeviceDto) {
    return this.request(userId, 'POST', '/api/v1/app/devices/claim', {
      data: payload,
    });
  }

  listDevices(userId: string) {
    return this.request(userId, 'GET', '/api/v1/app/devices');
  }

  getDeviceConfig(userId: string, deviceId: string) {
    return this.request(userId, 'GET', `/api/v1/app/devices/${deviceId}/config`);
  }

  updateDeviceConfig(
    userId: string,
    deviceId: string,
    payload: HiveScaleConfigPatchDto,
  ) {
    return this.request(userId, 'PATCH', `/api/v1/app/devices/${deviceId}/config`, {
      data: payload,
    });
  }

  listMeasurements(
    userId: string,
    deviceId: string,
    query: HiveScaleMeasurementQuery,
  ) {
    return this.request(
      userId,
      'GET',
      `/api/v1/app/devices/${deviceId}/measurements`,
      { params: query as Record<string, unknown> },
    );
  }

  latestMeasurements(userId: string, deviceId: string, limit?: number) {
    return this.request(
      userId,
      'GET',
      `/api/v1/app/devices/${deviceId}/measurements/latest`,
      { params: { limit } },
    );
  }
}
