import { Injectable } from '@nestjs/common';
import {
  register,
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
} from 'prom-client';
import { CustomLoggerService } from '../../logger/logger.service';

@Injectable()
export class PrometheusService {
  // Application-specific metrics
  private readonly apiCallsCounter: Counter;
  private readonly activeUsersGauge: Gauge;
  private readonly inspectionDurationHistogram: Histogram;
  private readonly apiErrorsCounter: Counter;
  private readonly hivesTotal: Gauge;
  private readonly apiariesTotal: Gauge;
  private readonly queensTotal: Gauge;
  private readonly inspectionsTotal: Gauge;

  constructor(private readonly logger: CustomLoggerService) {
    this.logger.setContext('PrometheusService');

    // Initialize metrics
    this.apiCallsCounter = new Counter({
      name: 'hivepal_api_calls_total',
      help: 'Total number of API calls',
      labelNames: ['method', 'endpoint', 'status_code'],
    });

    this.activeUsersGauge = new Gauge({
      name: 'hivepal_active_users',
      help: 'Number of currently active users',
    });

    this.apiErrorsCounter = new Counter({
      name: 'hivepal_api_errors_total',
      help: 'Total number of API errors',
      labelNames: ['method', 'endpoint', 'error_type'],
    });

    this.inspectionDurationHistogram = new Histogram({
      name: 'hivepal_inspection_duration_seconds',
      help: 'Duration of inspections in seconds',
      buckets: [5, 10, 30, 60, 120, 300, 600, 1800],
    });

    this.hivesTotal = new Gauge({
      name: 'hivepal_hives_total',
      help: 'Total number of hives',
    });

    this.apiariesTotal = new Gauge({
      name: 'hivepal_apiaries_total',
      help: 'Total number of apiaries',
    });

    this.queensTotal = new Gauge({
      name: 'hivepal_queens_total',
      help: 'Total number of queens',
    });

    this.inspectionsTotal = new Gauge({
      name: 'hivepal_inspections_total',
      help: 'Total number of inspections',
    });

    this.init();
  }

  private init() {
    this.logger.log('Initializing Prometheus metrics');

    // Add default Node.js metrics
    collectDefaultMetrics();

    this.logger.log('Prometheus metrics initialized');
  }

  // API call tracking
  incrementApiCalls(
    method: string,
    endpoint: string,
    statusCode: number,
  ): void {
    this.apiCallsCounter.inc({ method, endpoint, status_code: statusCode });
  }

  // API error tracking
  incrementApiErrors(
    method: string,
    endpoint: string,
    errorType: string,
  ): void {
    this.apiErrorsCounter.inc({ method, endpoint, error_type: errorType });
  }

  // Active users tracking
  setActiveUsers(count: number): void {
    this.activeUsersGauge.set(count);
  }

  // Inspection duration tracking
  observeInspectionDuration(durationInSeconds: number): void {
    this.inspectionDurationHistogram.observe(durationInSeconds);
  }

  // Set entity counts
  setHivesCount(count: number): void {
    this.hivesTotal.set(count);
  }

  setApiariesCount(count: number): void {
    this.apiariesTotal.set(count);
  }

  setQueensCount(count: number): void {
    this.queensTotal.set(count);
  }

  setInspectionsCount(count: number): void {
    this.inspectionsTotal.set(count);
  }

  async getMetrics(): Promise<string> {
    this.logger.debug('Retrieving metrics');
    return register.metrics();
  }

  getMetricsContentType(): string {
    return register.contentType;
  }
}
