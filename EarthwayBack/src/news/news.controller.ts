import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { NewsService } from './news.service';
import { NewsQueryDto } from './dto/news-article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireEntitlement } from '../entitlements/entitlements.decorator';
import { EntitlementsGuard } from '../entitlements/entitlements.guard';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  /**
   * GET /api/news
   * Récupère les articles avec pagination et filtres
   * Query params: theme, search, page, limit
   */
  @Get()
  @SkipThrottle()
  async findAll(@Query() query: NewsQueryDto) {
    return this.newsService.findAll(query);
  }

  /**
   * GET /api/news/:id
   * Récupère un article par ID
   */
  @Get(':id')
  @SkipThrottle()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const article = await this.newsService.findOne(id);
    
    if (!article) {
      throw new NotFoundException(`Article avec ID ${id} non trouvé`);
    }

    return article;
  }

  /**
   * GET /api/news/rss/trigger
   * Déclenche manuellement le parsing RSS (admin only - à protéger plus tard)
   */
  @UseGuards(JwtAuthGuard, EntitlementsGuard)
  @RequireEntitlement('premium_news')
  @Get('premium/insights')
  async getPremiumInsights() {
    return {
      message: 'Accès premium_news autorisé.',
      premium: true,
    };
  }

  @Get('rss/trigger')
  async triggerRSS() {
    return this.newsService.triggerRSSJob();
  }
}
