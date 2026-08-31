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

  private readonly subjectThemeHints: Array<{ theme: NewsTheme; keywords: string[] }> = [
    {
      theme: NewsTheme.oceans,
      keywords: [
        'oceans',
        'ocean',
        'océan',
        'océans',
        'mer',
        'marin',
        'corail',
        'coraux',
        'poisson',
        'peche',
        'pêche',
        'littoral',
        'meduse',
        'méduse',
        'arctique',
        'banquise',
      ],
    },
    {
      theme: NewsTheme.pollinators,
      keywords: ['pollinisateur', 'abeille', 'apicult', 'ruche', 'bourdon', 'papillon', 'insecte'],
    },
    {
      theme: NewsTheme.reforestation,
      keywords: ['foret', 'forêt', 'arbre', 'reforest', 'deforestation', 'déforestation', 'boisement', 'sylvicult', 'bois'],
    },
    {
      theme: NewsTheme.innovations,
      keywords: [
        'energie',
        'énergie',
        'innovation',
        'technolog',
        'startup',
        'renouvelable',
        'solaire',
        'eolien',
        'éolien',
        'batterie',
        'recyclage',
        'capture de co2',
      ],
    },
  ];

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
        item: ['media:content', 'media:thumbnail', 'enclosure', 'dc:subject', 'category'],
      },
    });
  }

  classifyTheme(text: string): NewsTheme {
    const normalized = text.toLowerCase();

    // Specific themes first; general is the final fallback.
    if (
      normalized.includes('océan')
      || normalized.includes('ocean')
      || normalized.includes('mer')
      || normalized.includes('marin')
      || normalized.includes('corail')
      || normalized.includes('coraux')
      || normalized.includes('poisson')
      || normalized.includes('pêche')
      || normalized.includes('littoral')
      || normalized.includes('méduse')
      || normalized.includes('arctique')
      || normalized.includes('banquise')
    ) {
      return NewsTheme.oceans;
    }

    if (
      normalized.includes('abeille')
      || normalized.includes('pollinisateur')
      || normalized.includes('apicult')
      || normalized.includes('ruche')
      || normalized.includes('bourdon')
      || normalized.includes('papillon')
      || normalized.includes('insecte')
    ) {
      return NewsTheme.pollinators;
    }

    if (
      normalized.includes('forêt')
      || normalized.includes('arbre')
      || normalized.includes('reforest')
      || normalized.includes('déforestation')
      || normalized.includes('boisement')
      || normalized.includes('sylvicult')
      || normalized.includes('bois')
    ) {
      return NewsTheme.reforestation;
    }

    if (
      normalized.includes('innovation')
      || normalized.includes('technolog')
      || normalized.includes('startup')
      || normalized.includes('renouvelable')
      || normalized.includes('solaire')
      || normalized.includes('éolien')
      || normalized.includes('batterie')
      || normalized.includes('recyclage')
      || normalized.includes('capture de co2')
    ) {
      return NewsTheme.innovations;
    }

    return NewsTheme.general;
  }

  private toSubjectText(subject: unknown): string {
    if (typeof subject === 'string') {
      return subject;
    }

    if (subject && typeof subject === 'object') {
      const maybeText = (subject as { _: unknown })._;
      if (typeof maybeText === 'string') {
        return maybeText;
      }
    }

    return '';
  }

  private extractSubjects(item: Record<string, unknown>): string[] {
    const values: unknown[] = [];
    const dcSubject = item['dc:subject'];
    const category = item.category;

    if (Array.isArray(dcSubject)) {
      values.push(...dcSubject);
    } else if (dcSubject) {
      values.push(dcSubject);
    }

    if (Array.isArray(category)) {
      values.push(...category);
    } else if (category) {
      values.push(category);
    }

    return values
      .map((value) => this.toSubjectText(value).trim())
      .filter((value) => value.length > 0);
  }

  private classifyThemeFromSubjects(subjects: string[]): NewsTheme | null {
    if (subjects.length === 0) {
      return null;
    }

    const normalizedSubjects = subjects.join(' ').toLowerCase();

    for (const config of this.subjectThemeHints) {
      if (config.keywords.some((keyword) => normalizedSubjects.includes(keyword))) {
        return config.theme;
      }
    }

    return null;
  }

  async reclassifyExistingArticles() {
    const generalArticles = await this.prisma.newsArticle.findMany({
      where: { theme: NewsTheme.general },
      select: { id: true, title: true, summary: true },
    });

    let reclassified = 0;

    for (const article of generalArticles) {
      const recalculatedTheme = this.classifyTheme(`${article.title ?? ''} ${article.summary ?? ''}`);

      if (recalculatedTheme !== NewsTheme.general) {
        await this.prisma.newsArticle.update({
          where: { id: article.id },
          data: { theme: recalculatedTheme },
        });
        reclassified++;
      }
    }

    return reclassified;
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
      // ✅ vérifié live, riche, FR (mais généraliste -> voir Option B)
      { url: 'https://reporterre.net/spip.php?page=backend', theme: NewsTheme.general },
      // ✅ confirmé par toi
      { url: 'https://www.futura-sciences.com/planete/rss/actu/', theme: NewsTheme.general },
      // ⚠️ à valider avec le diag wget avant de faire confiance
      { url: 'https://www.goodplanet.info/feed/', theme: NewsTheme.general },
      { url: 'https://www.actu-environnement.com/ae/rss/news.rss', theme: NewsTheme.general },
      { url: 'https://www.notre-planete.info/rss/actualites.xml', theme: NewsTheme.general },
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
            const subjects = this.extractSubjects(item as Record<string, unknown>);
            const subjectTheme = this.classifyThemeFromSubjects(subjects);

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
                theme: subjectTheme ?? this.classifyTheme(`${item.title ?? ''} ${item.contentSnippet ?? ''} ${subjects.join(' ')}`),
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
    const reclassified = await this.reclassifyExistingArticles();
    await this.invalidateListCache();

    return {
      newArticles: result.newArticles,
      reclassified,
    };
  }
}
