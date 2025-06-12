import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);

  // eslint-disable-next-line @typescript-eslint/require-await
  async sendNotification(message: string): Promise<void> {
    // TODO: Implement actual Slack integration
    // 1. Set up Slack webhook URL in environment variables
    // 2. Use axios to send POST request to Slack webhook
    // 3. Format message with proper Slack formatting and @mentions
    this.logger.error(`[SLACK SEND ACTION] ${message}`);
    void this._slacker(message);
  }

  private async _slacker(
    text: string,
    webHookURL = 'https://hooks.slack.com/services/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',
  ) {
    try {
      if (!webHookURL) return;
      await axios.post(webHookURL, {
        text: `${text}`,
      });
    } catch (error) {
      console.error('Slack post error: ', error);
    }
  }
}
