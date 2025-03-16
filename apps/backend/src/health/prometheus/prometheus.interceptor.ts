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

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;

    const endpoint = this.normalizeEndpoint(url);

    return next.handle().pipe(
      tap((data) => {
        const res = context.switchToHttp().getResponse();
        const statusCode = res.statusCode;

        // Increment API calls counter
        this.prometheusService.incrementApiCalls(method, endpoint, statusCode);

        // Specific metrics for entity counts
        this.trackEntityCounts(endpoint, data);
      }),
      catchError((err) => {
        const statusCode = err instanceof HttpException ? err.getStatus() : 500;
        const errorType = err.name || 'UnknownError';

        // Increment API error counter
        this.prometheusService.incrementApiErrors(method, endpoint, errorType);

        // Increment API calls counter with error status
        this.prometheusService.incrementApiCalls(method, endpoint, statusCode);

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

  private trackEntityCounts(endpoint: string, data: any): void {
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
    } catch (error) {
      this.logger.warn('Error tracking entity counts', error.stack);
    }
  }
}
