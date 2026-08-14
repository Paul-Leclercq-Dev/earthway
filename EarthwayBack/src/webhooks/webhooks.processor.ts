import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { WebhooksService } from './webhooks.service';

@Processor('stripe-events')
export class WebhooksProcessor {
  private readonly logger = new Logger(WebhooksProcessor.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Process('process-event')
  async processStripeEvent(job: Job<{ eventId: string }>) {
    const { eventId } = job.data;
    this.logger.log(`Dequeued Stripe eventId=${eventId} jobId=${job.id}`);

    try {
      await this.webhooksService.processQueuedEvent(eventId);
    } catch (error) {
      const maxAttempts = job.opts.attempts ?? 1;
      const nextAttempt = job.attemptsMade + 1;

      if (nextAttempt >= maxAttempts) {
        await this.webhooksService.markWebhookFailed(eventId);
        this.logger.error(
          `Queue processing exhausted retries eventId=${eventId} jobId=${job.id} attempts=${nextAttempt}/${maxAttempts} error=${(error as Error).message}`,
        );
      } else {
        this.logger.warn(
          `Queue processing retry scheduled eventId=${eventId} jobId=${job.id} attempts=${nextAttempt}/${maxAttempts} error=${(error as Error).message}`,
        );
      }

      throw error;
    }
  }
}
