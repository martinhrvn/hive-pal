import './instrument';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setup } from './setup';
import { CustomLoggerService } from './logger/logger.service';
import { createPrerenderFallback } from './prerender-fallback.middleware';
import { startMetricsServer } from './health/prometheus/metrics-server';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Serve prerendered language-prefixed public pages before ServeStaticModule
  // (which registers in onModuleInit, i.e. during listen()). Must precede it so
  // a route like `/da` isn't shadowed by the `da/` directory.
  app.use(createPrerenderFallback(join(__dirname, '..', 'static')));
  if (process.env.NODE_ENV !== 'production') {
    app.enableCors({
      origin: ['http://localhost:5173'],
      credentials: true,
    });
  }
  app.setGlobalPrefix('api', {
    exclude: ['env.js'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in the DTO
      transform: true, // Transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw errors if unknown properties are present
    }),
  );

  const loggerPromise = app.resolve(CustomLoggerService);
  const loggerInstance = await loggerPromise;
  loggerInstance.setContext('Bootstrap');
  app.useLogger(loggerInstance);

  setup(app);
  await app.listen(process.env.PORT ?? 3000);
  loggerInstance.log(
    `Application listening on port ${process.env.PORT ?? 3000}`,
  );

  // Prometheus metrics are served from a dedicated internal port (default
  // 9100), kept separate from the public API so the endpoint can stay
  // unpublished / off the internet. See metrics-server.ts.
  const metricsServer = startMetricsServer(loggerInstance);
  const shutdownMetrics = () => metricsServer.close();
  process.once('SIGTERM', shutdownMetrics);
  process.once('SIGINT', shutdownMetrics);
}
bootstrap().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
