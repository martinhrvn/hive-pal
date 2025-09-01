import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    return Sentry.startSpan(
      {
        name: `${method} ${url}`,
        op: 'http.server',
        attributes: {
          'http.method': method,
          'http.url': url,
        },
      },
      () => {
        return next.handle().pipe(
          tap({
            next: (data) => {
              Sentry.setContext('response', {
                statusCode: context.switchToHttp().getResponse().statusCode,
                data: data,
              });
            },
            error: (error) => {
              Sentry.captureException(error);
            },
          }),
        );
      },
    );
  }
}