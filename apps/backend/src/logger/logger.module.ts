import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import LokiTransport from 'winston-loki';
import { CustomLoggerService } from './logger.service';

const transports: winston.transport[] = [
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
];

console.log(process.env.LOKI_HOST);

// Conditionally add Loki transport if LOKI_HOST is set
if (process.env.LOKI_HOST) {
  transports.push(
    new LokiTransport({
      host: process.env.LOKI_HOST,
      labels: { app: 'nestjs' },
      json: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      replaceTimestamp: false,
      onConnectionError: (err) => console.error('Loki connection error:', err),
    }),
  );
}

@Module({
  imports: [
    WinstonModule.forRoot({
      transports,
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
