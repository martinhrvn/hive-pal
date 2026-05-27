import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HttpHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  HealthCheck,
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
    private memory: MemoryHealthIndicator,
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

      // Check if the memory usage is below thresholds
      () => this.memory.checkHeap('memory_heap', this.heapThreshold),
      () => this.memory.checkRSS('memory_rss', this.rssThreshold),

      // Check database connection
      () => this.prismaHealth.isHealthy('database'),
    ]);
  }
}
