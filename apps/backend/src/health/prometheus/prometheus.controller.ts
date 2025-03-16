import {
  Controller,
  Get,
  Header,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { PrometheusService } from './prometheus.service';
import { Request } from 'express';
import { CustomLoggerService } from '../../logger/logger.service';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller('metrics')
export class PrometheusController {
  constructor(
    private readonly prometheusService: PrometheusService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('PrometheusController');
  }

  @Get()
  @ApiExcludeEndpoint()
  @Header(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  )
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @Header('Surrogate-Control', 'no-store')
  async getMetrics(@Req() req: Request): Promise<string> {
    this.logger.log(`Metrics accessed by ${req.ip}`);
    const contentType = this.prometheusService.getMetricsContentType();
    req.res?.setHeader('Content-Type', contentType);

    return this.prometheusService.getMetrics();
  }
}
