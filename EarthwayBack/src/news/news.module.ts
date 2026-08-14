import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import Redis from 'ioredis';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsProcessor } from './news.processor';
import { REDIS_CLIENT } from './news.constants';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [
    ConfigModule,
    EntitlementsModule,
    BullModule.registerQueue({
      name: 'news',
    }),
  ],
  controllers: [NewsController],
  providers: [
    {
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
        client.on('error', () => { /* Redis unavailable in dev - cache disabled */ });
        return client;
      },
      inject: [ConfigService],
    },
    NewsService,
    NewsProcessor,
  ],
  exports: [NewsService],
})
export class NewsModule {}
