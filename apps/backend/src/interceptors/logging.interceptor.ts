import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CustomLoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLoggerService) {
    this.logger.setContext('Interceptor');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: Request = context.switchToHttp().getRequest();
    const { method, url } = req;
    const controller = context.getClass().name;
    const handler = context.getHandler().name;
    const requestId: string | undefined = req['requestId'] as
      | string
      | undefined;

    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          this.logger.debug({
            message: `${controller}.${handler} completed`,
            controller,
            handler,
            method,
            url,
            duration,
            requestId,
          });
        },
        error: () => {
          // Errors are handled by the exception filter
        },
      }),
    );
  }
}
