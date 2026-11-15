import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CustomLoggerService } from './logger/logger.service';
import { SentryExceptionCaptured } from '@sentry/nestjs';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: CustomLoggerService) {
    this.logger.setContext('Exception');
  }

  @SentryExceptionCaptured()
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Get request ID if available
    const requestId = request['requestId'] as string | undefined;
    // Extract meaningful data
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message || 'Internal server error',
      requestId,
    };

    const logPayload = { exceptionName: exception.name, ...errorResponse };
    if (status >= 500) {
      this.logger.error(
        { ...logPayload, exception: JSON.stringify(exception) },
        exception.stack,
      );
    } else {
      // Client errors (bad input, auth, unknown routes, scanner probes) are
      // expected traffic: keep them visible, but not as errors with a trace.
      this.logger.warn(logPayload);
    }

    // Send response to client (hide sensitive details in production)
    response.status(status).json(errorResponse);
  }
}
