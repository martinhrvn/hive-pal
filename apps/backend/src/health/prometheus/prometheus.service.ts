import { Injectable } from '@nestjs/common';
import {
  register,
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
} from 'prom-client';
import { CustomLoggerService } from '../../logger/logger.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrometheusService {
  // --- Operational metrics ---
  private readonly apiCallsCounter: Counter;
  private readonly apiErrorsCounter: Counter;
  private readonly httpRequestDuration: Histogram;

  // --- Business event counters (emitted on create) ---
  private readonly hivesCreatedCounter: Counter;
  private readonly apiariesCreatedCounter: Counter;
  private readonly queensCreatedCounter: Counter;
  private readonly inspectionsCreatedCounter: Counter;
  private readonly weatherFetchesCounter: Counter;

  constructor(
    private readonly logger: CustomLoggerService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.setContext('PrometheusService');

    // --- Operational metrics ---
    this.apiCallsCounter = new Counter({
      name: 'hivepal_api_calls_total',
      help: 'Total number of API calls',
      labelNames: ['method', 'endpoint', 'status_code'],
    });

    this.apiErrorsCounter = new Counter({
      name: 'hivepal_api_errors_total',
      help: 'Total number of API errors',
      labelNames: ['method', 'endpoint', 'error_type'],
    });

    this.httpRequestDuration = new Histogram({
      name: 'hivepal_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'endpoint', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });

    // --- Business event counters ---
    this.hivesCreatedCounter = new Counter({
      name: 'hivepal_hives_created_total',
      help: 'Total number of hives created',
    });

    this.apiariesCreatedCounter = new Counter({
      name: 'hivepal_apiaries_created_total',
      help: 'Total number of apiaries created',
    });

    this.queensCreatedCounter = new Counter({
      name: 'hivepal_queens_created_total',
      help: 'Total number of queens created',
    });

    this.inspectionsCreatedCounter = new Counter({
      name: 'hivepal_inspections_created_total',
      help: 'Total number of inspections created',
    });

    this.weatherFetchesCounter = new Counter({
      name: 'hivepal_weather_fetches_total',
      help: 'Total number of weather API fetches to Open-Meteo',
      labelNames: ['endpoint', 'outcome'],
    });

    this.init();
    this.registerBusinessGauges();
  }

  private init() {
    this.logger.log('Initializing Prometheus metrics');
    // Default Node.js process metrics (CPU, memory, event loop, GC, ...)
    collectDefaultMetrics();
    this.logger.log('Prometheus metrics initialized');
  }

  /**
   * Live business totals. These gauges read the database at scrape time via an
   * async `collect()` callback, so they always reflect the true current state
   * (creates, deletes, seed data, restarts) rather than being pushed from
   * request handlers. Each collect is wrapped in try/catch: a throwing collect
   * would fail the entire /metrics scrape, so on DB error we log and keep the
   * previous value.
   */
  private registerBusinessGauges(): void {
    const { prisma, logger } = this;

    new Gauge({
      name: 'hivepal_users',
      help: 'Current number of registered users',
      async collect() {
        try {
          this.set(await prisma.user.count());
        } catch (err) {
          logger.warn(`Failed to collect hivepal_users: ${String(err)}`);
        }
      },
    });

    new Gauge({
      name: 'hivepal_apiaries',
      help: 'Current number of apiaries',
      async collect() {
        try {
          this.set(await prisma.apiary.count());
        } catch (err) {
          logger.warn(`Failed to collect hivepal_apiaries: ${String(err)}`);
        }
      },
    });

    new Gauge({
      name: 'hivepal_hives',
      help: 'Current number of hives by status',
      labelNames: ['status'],
      async collect() {
        try {
          const rows = await prisma.hive.groupBy({
            by: ['status'],
            _count: { _all: true },
          });
          this.reset();
          for (const row of rows) {
            this.set({ status: row.status }, row._count._all);
          }
        } catch (err) {
          logger.warn(`Failed to collect hivepal_hives: ${String(err)}`);
        }
      },
    });

    new Gauge({
      name: 'hivepal_queens',
      help: 'Current number of queens by status',
      labelNames: ['status'],
      async collect() {
        try {
          const rows = await prisma.queen.groupBy({
            by: ['status'],
            _count: { _all: true },
          });
          this.reset();
          for (const row of rows) {
            this.set({ status: row.status }, row._count._all);
          }
        } catch (err) {
          logger.warn(`Failed to collect hivepal_queens: ${String(err)}`);
        }
      },
    });

    new Gauge({
      name: 'hivepal_inspections',
      help: 'Current number of inspections by status',
      labelNames: ['status'],
      async collect() {
        try {
          const rows = await prisma.inspection.groupBy({
            by: ['status'],
            _count: { _all: true },
          });
          this.reset();
          for (const row of rows) {
            this.set({ status: row.status }, row._count._all);
          }
        } catch (err) {
          logger.warn(`Failed to collect hivepal_inspections: ${String(err)}`);
        }
      },
    });
  }

  // --- Operational metric recording (called from the interceptor) ---
  incrementApiCalls(
    method: string,
    endpoint: string,
    statusCode: number,
  ): void {
    this.apiCallsCounter.inc({ method, endpoint, status_code: statusCode });
  }

  incrementApiErrors(
    method: string,
    endpoint: string,
    errorType: string,
  ): void {
    this.apiErrorsCounter.inc({ method, endpoint, error_type: errorType });
  }

  observeHttpRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    durationInSeconds: number,
  ): void {
    this.httpRequestDuration.observe(
      { method, endpoint, status_code: statusCode },
      durationInSeconds,
    );
  }

  // --- Business event recording (called from service create() methods) ---
  incrementHivesCreated(): void {
    this.hivesCreatedCounter.inc();
  }

  incrementApiariesCreated(): void {
    this.apiariesCreatedCounter.inc();
  }

  incrementQueensCreated(): void {
    this.queensCreatedCounter.inc();
  }

  incrementInspectionsCreated(): void {
    this.inspectionsCreatedCounter.inc();
  }

  incrementWeatherFetches(
    endpoint: 'hourly' | 'daily',
    outcome: 'success' | 'error',
  ): void {
    this.weatherFetchesCounter.inc({ endpoint, outcome });
  }

  async getMetrics(): Promise<string> {
    this.logger.debug('Retrieving metrics');
    return register.metrics();
  }

  getMetricsContentType(): string {
    return register.contentType;
  }
}
