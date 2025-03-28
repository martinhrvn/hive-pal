import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import * as path from 'path';
import { CustomLoggerService } from './logger/logger.service';

/**
 * Generate Swagger documentation in YAML format
 */
async function generateSwaggerYAML() {
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

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      strategy: 'excludeAll',
      excludeExtraneousValues: true,
    }),
  );
  const loggerPromise = app.resolve(CustomLoggerService);
  const loggerInstance = await loggerPromise;
  loggerInstance.setContext('Bootstrap');
  app.useLogger(loggerInstance);
  const config = new DocumentBuilder()
    .setTitle('API Example')
    .setDescription('The API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config, {});
  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Convert to YAML and write to file
  const yamlString = yaml.dump(document);
  fs.writeFileSync(path.join(docsDir, 'swagger.yaml'), yamlString);

  // Also save as JSON if needed
  fs.writeFileSync(
    path.join(docsDir, 'swagger.json'),
    JSON.stringify(document, null, 2),
  );
  console.log('Swagger documentation generated successfully:');
  console.log(`- YAML: ${path.join(docsDir, 'swagger.yaml')}`);
  console.log(`- JSON: ${path.join(docsDir, 'swagger.json')}`);
  await app.close();
}

// Execute the function
generateSwaggerYAML().catch((err) => {
  console.error('Error generating Swagger documentation:', err);
  process.exit(1);
});
