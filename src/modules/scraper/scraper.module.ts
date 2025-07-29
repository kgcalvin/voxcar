import { Module } from '@nestjs/common';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { CarsModule } from '../cars/cars.module';
import { SlackService } from '../../common/services/slack.service';
import { AiService } from '../../common/services/ai.service';
import { NlpService } from '../cars/nlp.service';

@Module({
  imports: [CarsModule],
  controllers: [ScraperController],
  providers: [ScraperService, SlackService, AiService, NlpService],
})
export class ScraperModule {}
