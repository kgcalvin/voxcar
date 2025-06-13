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
  private readonly MAX_BLOCKS_PER_MESSAGE = 50; // Slack's recommended limit

  async sendNotification(message: string, imageUrls?: string[]): Promise<void> {
    try {
      // Split message into sections if it contains newlines
      const messageSections = message
        .split('\n')
        .filter((section) => section.trim());

      // Create blocks for the message
      const blocks: SlackBlock[] = messageSections.map((section) => ({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: section,
        },
      }));

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

      // Split blocks into chunks if they exceed the limit
      const blockChunks = this._chunkArray(blocks, this.MAX_BLOCKS_PER_MESSAGE);

      // Send each chunk as a separate message
      for (const chunk of blockChunks) {
        const slackMessage: SlackMessage = {
          blocks: chunk,
          text: message, // Fallback text for clients that don't support blocks
        };

        await this._slacker(slackMessage);
      }
    } catch (error) {
      this.logger.error('Error sending Slack notification:', error);
    }
  }

  private _chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async _slacker(
    message: SlackMessage,
    webHookURL = 'https://hooks.slack.com/services/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',
  ) {
    try {
      if (!webHookURL) return;
      await axios.post(webHookURL, message);
    } catch (error) {
      this.logger.error('Slack post error:', error);
    }
  }
}
