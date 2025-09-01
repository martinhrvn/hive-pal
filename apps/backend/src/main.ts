import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setup } from './setup';
import { CustomLoggerService } from './logger/logger.service';
import { initSentry } from './sentry/sentry.setup';

initSentry();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.setGlobalPrefix('api');
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
}
bootstrap().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
