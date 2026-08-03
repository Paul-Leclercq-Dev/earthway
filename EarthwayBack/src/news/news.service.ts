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

const NEWS_CACHE_TTL = 86400; // 24h

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly parser: any;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    @InjectQueue('news') private newsQueue: Queue,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
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
    // Convertir en nombres (les query params arrivent en string)
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const cacheKey = `news:all:${theme ?? 'all'}:${search ?? ''}:${pageNum}:${limitNum}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return JSON.parse(cached);
    }

    const where: any = {};

    if (theme) {
      where.theme = theme;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
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

    await this.redis.setex(cacheKey, NEWS_CACHE_TTL, JSON.stringify(result));
    this.logger.debug(`Cache set: ${cacheKey}`);

    return result;
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

    this.logger.log(`✅ Parsing RSS terminé. ${totalNew} nouveaux articles ajoutés.`);
    return { success: true, newArticles: totalNew };
  }

  /**
   * Déclenche le job RSS manuellement (pour tests)
   */
  async triggerRSSJob() {
    await this.newsQueue.add('fetch-rss', {}, { priority: 1 });
    return { message: 'Job RSS ajouté à la queue' };
  }
}
