import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as express from 'express';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

function isIgnorableRedisError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: string; message?: string; port?: number };
  const code = candidate.code || '';
  const message = candidate.message || '';
  return (
    (code === 'ECONNREFUSED' || code === 'ENOTFOUND') &&
    (message.includes('redis') || message.includes('6379') || candidate.port === 6379)
  );
}

process.on('unhandledRejection', (reason) => {
  if (isIgnorableRedisError(reason)) {
    console.warn('Redis indisponible en local: files Bull/Cache désactivées.');
    return;
  }
  throw reason;
});

process.on('uncaughtException', (error) => {
  if (isIgnorableRedisError(error)) {
    console.warn('Redis indisponible en local: files Bull/Cache désactivées.');
    return;
  }
  throw error;
});

async function bootstrap() {
  // rawBody must be enabled so Stripe signature verification can use the exact payload bytes.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use('/api/webhooks/stripe', express.raw({ type: '*/*' }));

  // Security: HTTP headers
  app.use(helmet());

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application running on: http://localhost:${port}/api`);
}
bootstrap();
