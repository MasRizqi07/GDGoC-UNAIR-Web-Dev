import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import helmet from 'helmet';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Security: helmet
  app.use(helmet());

  // Security: CORS allowlist from env (empty by default)
  const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  });

  // Security: body size limit 100 kB
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ limit: '100kb', extended: true }));

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Graceful shutdown
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
