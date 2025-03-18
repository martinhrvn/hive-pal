import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { PrometheusService } from './prometheus.service';
import { CustomLoggerService } from '../../logger/logger.service';

@Injectable()
export class PrometheusInterceptor implements NestInterceptor {
  constructor(
    private readonly prometheusService: PrometheusService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('PrometheusInterceptor');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Type-safe way to get request properties
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<{ method?: string; url?: string }>();
    const method = typeof req?.method === 'string' ? req.method : 'UNKNOWN';
    const url = typeof req?.url === 'string' ? req.url : 'UNKNOWN';

    const endpoint = this.normalizeEndpoint(url);

    return next.handle().pipe(
      tap((data) => {
        // Type-safe way to get response properties
        const res = httpContext.getResponse<{ statusCode?: number }>();
        const statusCode =
          typeof res?.statusCode === 'number' ? res.statusCode : 200;

        // Increment API calls counter
        this.prometheusService.incrementApiCalls(
          String(method),
          String(endpoint),
          Number(statusCode),
        );

        // Specific metrics for entity counts
        this.trackEntityCounts(endpoint, data);
      }),
      catchError((err: unknown) => {
        const statusCode = err instanceof HttpException ? err.getStatus() : 500;
        const errorType =
          typeof (err as Error).name === 'string'
            ? (err as Error).name
            : 'UnknownError';

        // Increment API error counter
        this.prometheusService.incrementApiErrors(
          String(method),
          String(endpoint),
          String(errorType),
        );

        // Increment API calls counter with error status
        this.prometheusService.incrementApiCalls(
          String(method),
          String(endpoint),
          Number(statusCode),
        );

        return throwError(() => err);
      }),
    );
  }

  private normalizeEndpoint(url: string): string {
    // Strip query params
    const baseUrl = url.split('?')[0];

    // Replace specific IDs with :id to group similar endpoints
    return baseUrl.replace(/\/[0-9a-f]{8,36}(?=\/|$)/g, '/:id');
  }

  private trackEntityCounts(endpoint: string, data: unknown): void {
    try {
      // Update entity counts based on response data when retrieving lists
      if (Array.isArray(data)) {
        if (endpoint === '/api/hives') {
          this.prometheusService.setHivesCount(data.length);
        } else if (endpoint === '/api/apiaries') {
          this.prometheusService.setApiariesCount(data.length);
        } else if (endpoint === '/api/queens') {
          this.prometheusService.setQueensCount(data.length);
        } else if (endpoint === '/api/inspections') {
          this.prometheusService.setInspectionsCount(data.length);
        }
      }
    } catch (error: unknown) {
      const errorStack =
        typeof (error as { stack?: string })?.stack === 'string'
          ? String((error as { stack: string }).stack)
          : undefined;

      this.logger.warn('Error tracking entity counts', errorStack);
    }
  }
}
