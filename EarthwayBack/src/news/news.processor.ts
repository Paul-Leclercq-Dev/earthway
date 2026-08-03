import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { NewsService } from './news.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Processor('news')
export class NewsProcessor {
  private readonly logger = new Logger(NewsProcessor.name);

  constructor(private readonly newsService: NewsService) {}

  /**
   * Traite les jobs de récupération RSS
   */
  @Process('fetch-rss')
  async handleFetchRSS(job: Job) {
    this.logger.log(`📰 Job RSS démarré (ID: ${job.id})`);
    
    try {
      const result = await this.newsService.fetchAndStoreRSSArticles();
      this.logger.log(`✅ Job RSS terminé: ${result.newArticles} nouveaux articles`);
      return result;
    } catch (error) {
      this.logger.error('❌ Erreur dans le job RSS:', error.message);
      throw error;
    }
  }

  /**
   * Cron job quotidien à 6h du matin
   * Récupère automatiquement les articles RSS
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM, {
    name: 'daily-rss-fetch',
    timeZone: 'Europe/Paris',
  })
  async scheduledRSSFetch() {
    this.logger.log('⏰ Cron job quotidien RSS déclenché');
    await this.newsService.triggerRSSJob();
  }
}
