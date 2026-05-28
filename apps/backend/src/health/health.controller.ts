import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HttpHealthIndicator,
  DiskHealthIndicator,
  HealthCheck,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { CustomLoggerService } from '../logger/logger.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaHealthIndicator } from './prisma/prisma.health';

const MB = 1024 * 1024;

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly heapThreshold: number;
  private readonly rssThreshold: number;

  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private disk: DiskHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
    private readonly logger: CustomLoggerService,
    config: ConfigService,
  ) {
    this.logger.setContext('HealthController');
    this.heapThreshold =
      Number(config.get<string>('HEALTH_HEAP_MB')) * MB || 512 * MB;
    this.rssThreshold =
      Number(config.get<string>('HEALTH_RSS_MB')) * MB || 1024 * MB;
  }

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check the health of the app' })
  @ApiResponse({ status: 200, description: 'Health check passed' })
  @ApiResponse({ status: 503, description: 'Health check failed' })
  check() {
    this.logger.debug('Performing health check');
    return this.health.check([
      // Check if the app is up
      () => this.http.pingCheck('nestjs-app', 'http://localhost:3000/api'),

      // Check if the disk has enough space
      () =>
        this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),

      // Memory is reported but never fails the health check — high memory is
      // a warning, not "service unavailable". Watch /metrics for trends.
      () => this.memoryReport(),

      // Check database connection
      () => this.prismaHealth.isHealthy('database'),
    ]);
  }

  private memoryReport(): HealthIndicatorResult {
    const { heapUsed, rss } = process.memoryUsage();
    const heapOver = heapUsed > this.heapThreshold;
    const rssOver = rss > this.rssThreshold;

    if (heapOver || rssOver) {
      this.logger.warn({
        message: 'Memory usage over threshold (not failing health)',
        heapUsed,
        heapThreshold: this.heapThreshold,
        rss,
        rssThreshold: this.rssThreshold,
      });
    }

    return {
      memory: {
        status: 'up',
        heapUsed,
        heapThreshold: this.heapThreshold,
        heapOverThreshold: heapOver,
        rss,
        rssThreshold: this.rssThreshold,
        rssOverThreshold: rssOver,
      },
    };
  }
}
