import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  elements?: Array<{
    type: string;
    text?: string;
    url?: string;
  }>;
  image_url?: string;
  alt_text?: string;
}

interface SlackMessage {
  blocks?: SlackBlock[];
  text?: string;
}

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);

  async sendNotification(message: string, imageUrls?: string[]): Promise<void> {
    const blocks: SlackBlock[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
    ];

    // Add image blocks if imageUrls are provided
    if (imageUrls && imageUrls.length > 0) {
      imageUrls.forEach((url) => {
        blocks.push({
          type: 'image',
          image_url: url,
          alt_text: 'Car image',
        });
      });
    }

    const slackMessage: SlackMessage = {
      blocks,
      text: message, // Fallback text for clients that don't support blocks
    };

    await this._slacker(slackMessage);
  }

  private async _slacker(
    message: SlackMessage,
    webHookURL = 'https://hooks.slack.com/services/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',
  ) {
    try {
      if (!webHookURL) return;
      await axios.post(webHookURL, message);
    } catch (error) {
      console.error('Slack post error: ', error);
    }
  }
}
