import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Provider } from '@nestjs/common';
import { existsSync } from 'fs';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (configService: ConfigService) => {
    const isDockerRuntime = existsSync('/.dockerenv');
    const envRedisHost = configService.get<string>('REDIS_HOST', 'localhost');
    const resolvedRedisHost = !isDockerRuntime && envRedisHost === 'redis' ? '127.0.0.1' : envRedisHost;
    const client = new Redis({
      host: resolvedRedisHost,
      port: configService.get<number>('REDIS_PORT', 6379),
      password: configService.get<string>('REDIS_PASSWORD') || undefined,
      lazyConnect: true,
      retryStrategy: () => null,
    });
    client.on('error', () => { /* Redis unavailable in dev - non-blocking */ });
    return client;
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule],
  providers: [redisProvider],
  exports: [redisProvider],
})
export class RedisConfigModule {}
