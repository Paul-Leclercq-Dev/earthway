import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ArgumentsHost, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import helmet from 'helmet';
import * as express from 'express';
import type { Request } from 'express';
import * as Sentry from '@sentry/node';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { Logger } from 'nestjs-pino';

const sentryDsn = process.env.SENTRY_DSN;
const sentryEnabled = Boolean(sentryDsn);
const sensitiveKeyPattern = /(pass(word)?|token|secret|authorization|cookie|session|api[-_]?key)/i;

function sanitizeSensitiveData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeSensitiveData(entry));
  }

  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (sensitiveKeyPattern.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeSensitiveData(entry);
      }
    }

    return sanitized;
  }

  return value;
}

function sanitizeSentryEvent<T extends Sentry.ErrorEvent>(event: T): T {
  const sanitizedRequestHeaders = { ...(event.request?.headers ?? {}) };
  delete sanitizedRequestHeaders.authorization;
  delete sanitizedRequestHeaders.cookie;
  delete sanitizedRequestHeaders['set-cookie'];
  delete sanitizedRequestHeaders['x-api-key'];

  return {
    ...event,
    user: undefined,
    request: event.request
      ? {
          ...event.request,
          headers: sanitizedRequestHeaders,
          data: sanitizeSensitiveData(event.request.data),
        }
      : undefined,
    extra: sanitizeSensitiveData(event.extra) as T['extra'],
    contexts: sanitizeSensitiveData(event.contexts) as T['contexts'],
  } as T;
}

class SentryExceptionsFilter implements ExceptionFilter {
  private readonly fallbackFilter = new AllExceptionsFilter();

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (sentryEnabled) {
      const error = exception instanceof Error ? exception : new Error(String(exception));
      Sentry.withScope((scope) => {
        scope.setLevel(status >= 500 ? 'error' : 'warning');
        scope.setTag('http.method', request.method);
        scope.setTag('http.path', request.url);
        scope.setTag('http.status_code', String(status));
        scope.setTag('route.category', request.url.includes('/webhooks/stripe') ? 'stripe_webhook' : 'app');
        scope.setContext('request', {
          id: request.headers['x-request-id'] || null,
          method: request.method,
          path: request.url,
          params: sanitizeSensitiveData(request.params) as Record<string, unknown>,
          query: sanitizeSensitiveData(request.query) as Record<string, unknown>,
          body: sanitizeSensitiveData(request.body) as Record<string, unknown>,
          headers: sanitizeSensitiveData({
            'content-type': request.headers['content-type'],
            'user-agent': request.headers['user-agent'],
            'stripe-signature': request.headers['stripe-signature'] ? '[REDACTED]' : undefined,
          }) as Record<string, unknown>,
        });
        Sentry.captureException(error);
      });
    }

    this.fallbackFilter.catch(exception, host);
  }
}

if (sentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    sendDefaultPii: false,
    beforeSend: sanitizeSentryEvent,
  });
} else {
  // Keep local/dev behavior explicit: no event is sent without DSN.
  console.info('Sentry disabled: SENTRY_DSN is not set.');
}

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

  if (sentryEnabled) {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    Sentry.captureException(error);
    void Sentry.flush(2000);
  }

  throw reason;
});

process.on('uncaughtException', (error) => {
  if (isIgnorableRedisError(error)) {
    console.warn('Redis indisponible en local: files Bull/Cache désactivées.');
    return;
  }

  if (sentryEnabled) {
    Sentry.captureException(error);
    void Sentry.flush(2000);
  }

  throw error;
});

async function bootstrap() {
  // rawBody must be enabled so Stripe signature verification can use the exact payload bytes.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.useLogger(app.get(Logger));

  app.use('/api/webhooks/stripe', express.raw({ type: '*/*' }));

  // Security: HTTP headers
  app.use(helmet());

  // Global exception filter (forwards errors to Sentry before keeping existing response shape).
  app.useGlobalFilters(new SentryExceptionsFilter());

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
  app.get(Logger).log(`Application running on: http://localhost:${String(port)}/api`);
}
bootstrap();
