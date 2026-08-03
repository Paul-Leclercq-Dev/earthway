import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsQueryDto } from './dto/news-article.dto';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  /**
   * GET /api/news
   * Récupère les articles avec pagination et filtres
   * Query params: theme, search, page, limit
   */
  @Get()
  async findAll(@Query() query: NewsQueryDto) {
    return this.newsService.findAll(query);
  }

  /**
   * GET /api/news/:id
   * Récupère un article par ID
   */
  @Get(':id')
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
  @Get('rss/trigger')
  async triggerRSS() {
    return this.newsService.triggerRSSJob();
  }
}
