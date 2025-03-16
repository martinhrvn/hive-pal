import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CustomLoggerService } from './logger.service';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid @types/uuid

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: CustomLoggerService) {
    this.logger.setContext('HTTP');
  }

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || '';

    // Generate a unique request ID
    const requestId = uuidv4();
    req['requestId'] = requestId;

    // Store start time
    const start = Date.now();

    // Log request
    this.logger.log({
      message: `Incoming request: ${method} ${originalUrl}`,
      method,
      url: originalUrl,
      ip,
      userAgent,
      requestId,
    });

    // Add response logging when finished
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;
      const duration = Date.now() - start;

      if (statusCode >= 400) {
        this.logger.error({
          message: `Request failed: ${method} ${originalUrl}`,
          statusCode,
          duration,
          requestId,
          contentLength,
        });
      } else {
        this.logger.log({
          message: `Request completed: ${method} ${originalUrl}`,
          statusCode,
          duration,
          requestId,
          contentLength,
        });
      }
    });

    next();
  }
}
