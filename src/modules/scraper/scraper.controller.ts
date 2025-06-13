import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ScraperService } from './scraper.service';

interface WebhookPayload {
  scrapingjob_id?: string;
  status?: string;
  sitemap_id: string;
  sitemap_name: string;
}

@Controller('scraper')
export class ScraperController {
  private readonly logger = new Logger(ScraperController.name);

  constructor(private readonly scraperService: ScraperService) {}

  @Post('webhook')
  async handleWebhook(
    @Body() payload: WebhookPayload,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Received webhook for job ${payload?.scrapingjob_id} with status ${payload?.status}`,
    );

    if (payload.status === 'finished' && payload.scrapingjob_id) {
      try {
        await this.scraperService.processScrapedCars(
          payload.scrapingjob_id,
          payload.sitemap_id,
        );
        return { message: 'Data recieved successfully' };
      } catch (error) {
        this.logger.error(`Error processing webhook data:`, error);
        throw error;
      }
    }

    return { message: 'Webhook received but no action taken' };
  }
}
