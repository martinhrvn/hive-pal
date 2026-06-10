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
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        // Type-safe way to get response properties
        const res = httpContext.getResponse<{ statusCode?: number }>();
        const statusCode =
          typeof res?.statusCode === 'number' ? res.statusCode : 200;

        this.record(method, endpoint, statusCode, start);
      }),
      catchError((err: unknown) => {
        const statusCode = err instanceof HttpException ? err.getStatus() : 500;
        const errorType =
          typeof (err as Error).name === 'string'
            ? (err as Error).name
            : 'UnknownError';

        // Classify the error
        this.prometheusService.incrementApiErrors(
          String(method),
          String(endpoint),
          String(errorType),
        );

        this.record(method, endpoint, statusCode, start);

        return throwError(() => err);
      }),
    );
  }

  private record(
    method: string,
    endpoint: string,
    statusCode: number,
    start: number,
  ): void {
    const durationSeconds = (Date.now() - start) / 1000;
    this.prometheusService.incrementApiCalls(
      String(method),
      String(endpoint),
      Number(statusCode),
    );
    this.prometheusService.observeHttpRequest(
      String(method),
      String(endpoint),
      Number(statusCode),
      durationSeconds,
    );
  }

  private normalizeEndpoint(url: string): string {
    // Strip query params
    const baseUrl = url.split('?')[0];

    // Replace specific IDs with :id to group similar endpoints
    return baseUrl.replace(/\/[0-9a-f]{8,36}(?=\/|$)/g, '/:id');
  }
}
