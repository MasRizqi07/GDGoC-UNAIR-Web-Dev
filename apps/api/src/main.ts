import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import express from 'express';
import fs from 'node:fs';

if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
} else if (fs.existsSync('apps/api/.env')) {
  process.loadEnvFile('apps/api/.env');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Explicitly configure trust proxy for accurate rate limiting and IP tracking
  const expressApp = (app.getHttpAdapter().getInstance() as any);
  if (typeof expressApp?.set === 'function') {
    expressApp.set('trust proxy', 1);
  }

  app.setGlobalPrefix('api/v1');
  
  // Security headers: CSP, COOP, Referrer-Policy, HSTS (in production), X-Content-Type-Options
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
      xContentTypeOptions: true,
    }),
  );

  app.use(compression());

  // Permissions-Policy header
  app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [],
    credentials: true,
  });

  // Limit body size to 100kb as requested
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
