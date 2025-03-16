import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import LokiTransport from 'winston-loki';
import { CustomLoggerService } from './logger.service';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        // Console transport for local development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.colorize(),
            winston.format.printf(
              ({ timestamp, level, message, context, trace, ...meta }) => {
                return `${timestamp} [${context}] ${level}: ${message} ${
                  Object.keys(meta).length ? JSON.stringify(meta) : ''
                } ${trace || ''}`;
              },
            ),
          ),
        }),

        // Loki transport for structured logs in production
        new LokiTransport({
          host: process.env.LOKI_HOST || 'http://loki:3100',
          labels: { app: 'nestjs' },
          basicAuth: process.env.LOKI_AUTH,
          json: true,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
          replaceTimestamp: false,
          onConnectionError: (err) =>
            console.error('Loki connection error:', err),
        }),
      ],
      // Default meta data for log messages
      defaultMeta: {
        service: process.env.APP_NAME || 'nestjs-app',
        environment: process.env.NODE_ENV || 'development',
      },
    }),
  ],
  providers: [CustomLoggerService],
  exports: [CustomLoggerService],
})
export class LoggerModule {}
