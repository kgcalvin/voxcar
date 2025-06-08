import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);

  // eslint-disable-next-line @typescript-eslint/require-await
  async sendActionRequired(message: string): Promise<void> {
    // TODO: Implement actual Slack integration
    // 1. Set up Slack webhook URL in environment variables
    // 2. Use axios to send POST request to Slack webhook
    // 3. Format message with proper Slack formatting and @mentions
    this.logger.error(`[SLACK ACTION REQUIRED] ${message}`);
  }
}
