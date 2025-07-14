/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async processCarDescription(rawDescription: string): Promise<string> {
    try {
      if (!rawDescription || rawDescription.trim().length === 0) {
        return '';
      }

      const prompt = this.buildPrompt(rawDescription);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a car listing expert. Your job is to clean and structure car descriptions into well-organized HTML sections.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const processedDescription = completion.choices[0]?.message?.content;

      if (!processedDescription) {
        this.logger.warn(
          'AI service returned empty response, falling back to raw description',
        );
        return this.fallbackToRawDescription(rawDescription);
      }

      return processedDescription;
    } catch (error) {
      this.logger.error('Error processing description with AI:', error);
      return this.fallbackToRawDescription(rawDescription);
    }
  }

  private buildPrompt(rawDescription: string): string {
    return `
Please clean and structure the following car description into well-organized HTML sections.

Raw Description:
${rawDescription}

Please organize this into the following HTML sections:

1. **Overview** - Key highlights and general description
2. **Features** - Notable features, specifications, and amenities
3. **Condition & History** - Vehicle condition, maintenance history, any issues
4. **Additional Information** - Any other relevant details

Requirements:
- Use proper HTML tags (h3 for section headers, p for paragraphs, ul/li for lists)
- Keep the content factual and accurate
- Remove any redundant or unclear information
- Make it easy to read and well-structured
- If certain sections don't have relevant information, omit them
- Use bullet points for features when appropriate
- Keep the tone professional and informative

Return only the HTML content, no additional text or explanations.
`;
  }

  private fallbackToRawDescription(rawDescription: string): string {
    // Simple fallback that wraps the raw description in basic HTML
    return `<div class="car-description">
  <h3>Description</h3>
  <p>${rawDescription.replace(/\n/g, '</p><p>')}</p>
</div>`;
  }
}
