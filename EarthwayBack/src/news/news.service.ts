import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Parser = require('rss-parser');
import { NewsTheme } from '@prisma/client';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from './news.constants';

const DEFAULT_NEWS_CACHE_TTL = 86400; // 24h

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly parser: any;
  private readonly cacheTtl: number;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    @InjectQueue('news') private newsQueue: Queue,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    const configuredTtl = Number(this.config.get<string>('NEWS_CACHE_TTL') || DEFAULT_NEWS_CACHE_TTL);
    this.cacheTtl = Number.isFinite(configuredTtl) && configuredTtl > 0
      ? configuredTtl
      : DEFAULT_NEWS_CACHE_TTL;

    this.parser = new Parser({
      customFields: {
        item: ['media:content', 'media:thumbnail', 'enclosure'],
      },
    });
  }

  /**
   * Récupère les articles avec pagination et filtres (avec cache Redis 24h)
   */
  async findAll(filters: {
    theme?: NewsTheme;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { theme, search, page = 1, limit = 20 } = filters;
    const normalizedSearch = search?.trim();
    const isSearchQuery = Boolean(normalizedSearch);

    // Convertir en nombres (les query params arrivent en string)
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const cacheKey = `news:all:${theme ?? 'all'}:${normalizedSearch ?? ''}:${pageNum}:${limitNum}`;

    // Search results should be fresh and are not cached to avoid stale UX.
    if (!isSearchQuery) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit: ${cacheKey}`);
        return JSON.parse(cached);
      }
    }

    const where: any = {};

    if (theme) {
      where.theme = theme;
    }

    if (normalizedSearch) {
      where.OR = [
        { title: { contains: normalizedSearch } },
        { summary: { contains: normalizedSearch } },
        { content: { contains: normalizedSearch } },
      ];
    }

    const [articles, total] = await Promise.all([
      this.prisma.newsArticle.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.newsArticle.count({ where }),
    ]);

    const result = {
      data: articles,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    if (!isSearchQuery) {
      await this.redis.setex(cacheKey, this.cacheTtl, JSON.stringify(result));
      this.logger.debug(`Cache set: ${cacheKey}`);
    }

    return result;
  }

  private async invalidateListCache() {
    const pattern = 'news:all:*';
    let cursor = '0';
    let deleted = 0;

    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        deleted += keys.length;
        await this.redis.del(...keys);
      }
    } while (cursor !== '0');

    if (deleted > 0) {
      this.logger.debug(`Cache invalidated: ${deleted} keys removed`);
    }
  }

  /**
   * Récupère un article par ID
   */
  async findOne(id: number) {
    return this.prisma.newsArticle.findUnique({
      where: { id },
    });
  }

  /**
   * Parse les flux RSS et stocke les articles
   */
  async fetchAndStoreRSSArticles() {
    this.logger.log('Démarrage du parsing RSS...');

    const rssSources = [
      {
        url: 'https://www.sciencesetavenir.fr/nature-environnement/rss.xml',
        theme: NewsTheme.general,
      },
      {
        url: 'https://www.futura-sciences.com/planete/rss/actu/',
        theme: NewsTheme.general,
      },
      // Ajouter d'autres sources RSS selon les thèmes
    ];

    let totalNew = 0;

    for (const source of rssSources) {
      try {
        const feed = await this.parser.parseURL(source.url);
        
        for (const item of feed.items) {
          // Vérifier si l'article existe déjà (éviter doublons)
          const exists = await this.prisma.newsArticle.findFirst({
            where: { sourceUrl: item.link || '' },
          });

          if (!exists && item.link) {
            // Extraire l'image (plusieurs formats possibles)
            let imageUrl = item.enclosure?.url || null;
            if (!imageUrl && item['media:content']) {
              imageUrl = item['media:content']?.$.url || null;
            }
            if (!imageUrl && item['media:thumbnail']) {
              imageUrl = item['media:thumbnail']?.$.url || null;
            }

            await this.prisma.newsArticle.create({
              data: {
                title: item.title || 'Sans titre',
                summary: item.contentSnippet?.substring(0, 500) || '',
                content: item.content || item.contentSnippet || '',
                sourceUrl: item.link,
                imageUrl,
                source: feed.title || 'RSS Feed',
                author: item.creator || item.author || null,
                theme: source.theme,
                publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
              },
            });

            totalNew++;
          }
        }

        this.logger.log(`RSS parsé: ${feed.title} - ${feed.items.length} articles`);
      } catch (error) {
        this.logger.error(`Erreur parsing RSS ${source.url}:`, (error as Error).message);
      }
    }

    if (totalNew > 0) {
      await this.invalidateListCache();
    }

    this.logger.log(`✅ Parsing RSS terminé. ${totalNew} nouveaux articles ajoutés.`);
    return { success: true, newArticles: totalNew };
  }

  /**
   * Déclenche le job RSS manuellement (pour tests)
   */
  async triggerRSSJob() {
    const result = await this.fetchAndStoreRSSArticles();
    return {
      message: 'RSS refresh terminé',
      ...result,
    };
  }
}
