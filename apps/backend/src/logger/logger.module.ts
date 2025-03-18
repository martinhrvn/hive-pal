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
      winston.format.printf((info) => {
        const { timestamp, level, message, context, trace, ...meta } = info;

        // Handle each property safely with JSON.stringify to avoid base-to-string issues
        let ts = '';
        if (timestamp !== undefined) {
          ts =
            typeof timestamp === 'string'
              ? timestamp
              : JSON.stringify(timestamp);
        }

        let ctx = '';
        if (context !== undefined) {
          ctx = typeof context === 'string' ? context : JSON.stringify(context);
        }

        let lvl = '';
        if (level !== undefined) {
          lvl = typeof level === 'string' ? level : JSON.stringify(level);
        }

        let msg = '';
        if (message !== undefined) {
          msg = typeof message === 'string' ? message : JSON.stringify(message);
        }

        let trc = '';
        if (trace !== undefined) {
          trc = typeof trace === 'string' ? trace : JSON.stringify(trace);
        }

        return `${ts} [${ctx}] ${lvl}: ${msg} ${
          Object.keys(meta).length ? JSON.stringify(meta) : ''
        } ${trc}`;
      }),
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
