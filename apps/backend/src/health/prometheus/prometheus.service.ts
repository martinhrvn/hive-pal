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

type CounterConfig = {
  name: string;
  help: string;
  labelNames?: string[];
};

type GroupedCountRow = {
  status: string;
  _count: { _all: number };
};

const API_CALL_LABELS = ['method', 'endpoint', 'status_code'];
const API_ERROR_LABELS = ['method', 'endpoint', 'error_type'];
const HTTP_REQUEST_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
];

const businessCounterConfigs: Record<
  'hives' | 'apiaries' | 'queens' | 'inspections',
  CounterConfig
> = {
  hives: {
    name: 'hivepal_hives_created_total',
    help: 'Total number of hives created',
  },
  apiaries: {
    name: 'hivepal_apiaries_created_total',
    help: 'Total number of apiaries created',
  },
  queens: {
    name: 'hivepal_queens_created_total',
    help: 'Total number of queens created',
  },
  inspections: {
    name: 'hivepal_inspections_created_total',
    help: 'Total number of inspections created',
  },
};

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

    this.apiCallsCounter = this.createCounter({
      name: 'hivepal_api_calls_total',
      help: 'Total number of API calls',
      labelNames: API_CALL_LABELS,
    });

    this.apiErrorsCounter = this.createCounter({
      name: 'hivepal_api_errors_total',
      help: 'Total number of API errors',
      labelNames: API_ERROR_LABELS,
    });

    this.httpRequestDuration = new Histogram({
      name: 'hivepal_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: API_CALL_LABELS,
      buckets: HTTP_REQUEST_BUCKETS,
    });

    this.hivesCreatedCounter = this.createCounter(businessCounterConfigs.hives);
    this.apiariesCreatedCounter = this.createCounter(
      businessCounterConfigs.apiaries,
    );
    this.queensCreatedCounter = this.createCounter(
      businessCounterConfigs.queens,
    );
    this.inspectionsCreatedCounter = this.createCounter(
      businessCounterConfigs.inspections,
    );
    this.weatherFetchesCounter = this.createCounter({
      name: 'hivepal_weather_fetches_total',
      help: 'Total number of weather API fetches to Open-Meteo',
      labelNames: ['endpoint', 'outcome'],
    });

    this.init();
    this.registerBusinessGauges();
  }

  private createCounter(config: CounterConfig): Counter {
    return new Counter(config);
  }

  private init(): void {
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
    this.registerCountGauge(
      'hivepal_users',
      'Current number of registered users',
      () => this.prisma.user.count(),
    );
    this.registerCountGauge('hivepal_apiaries', 'Current number of apiaries', () =>
      this.prisma.apiary.count(),
    );

    this.registerStatusGauge(
      'hivepal_hives',
      'Current number of hives by status',
      () => this.collectHiveStatusRows(),
    );
    this.registerStatusGauge(
      'hivepal_queens',
      'Current number of queens by status',
      () => this.collectQueenStatusRows(),
    );
    this.registerStatusGauge(
      'hivepal_inspections',
      'Current number of inspections by status',
      () => this.collectInspectionStatusRows(),
    );
  }

  private async collectHiveStatusRows(): Promise<GroupedCountRow[]> {
    const rows = await this.prisma.hive.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return rows;
  }

  private async collectQueenStatusRows(): Promise<GroupedCountRow[]> {
    const rows = await this.prisma.queen.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return rows;
  }

  private async collectInspectionStatusRows(): Promise<GroupedCountRow[]> {
    const rows = await this.prisma.inspection.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return rows;
  }

  private registerCountGauge(
    name: string,
    help: string,
    collectValue: () => Promise<number>,
  ): void {
    const logger = this.logger;

    new Gauge({
      name,
      help,
      async collect() {
        try {
          this.set(await collectValue());
        } catch (err) {
          logger.warn(`Failed to collect ${name}: ${String(err)}`);
        }
      },
    });
  }

  private registerStatusGauge(
    name: string,
    help: string,
    collectRows: () => Promise<GroupedCountRow[]>,
  ): void {
    const logger = this.logger;

    new Gauge({
      name,
      help,
      labelNames: ['status'],
      async collect() {
        try {
          const rows = await collectRows();
          this.reset();
          for (const row of rows) {
            this.set({ status: row.status }, row._count._all);
          }
        } catch (err) {
          logger.warn(`Failed to collect ${name}: ${String(err)}`);
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
