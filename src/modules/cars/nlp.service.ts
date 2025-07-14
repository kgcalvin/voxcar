/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { CarListing } from '../../database/car-listing.entity';
import { NlpManager } from 'node-nlp';
import entityGroups from './entity-groups.json';
import englishWords from './english-words.json';

@Injectable()
export class NlpService implements OnModuleInit {
  manager: NlpManager;

  constructor() {}

  async onModuleInit() {
    await this.initializeNlpManager();
  }

  private addDocumentWithVariants(variants: string[], intent: string) {
    for (const variant of variants) {
      this.manager.addDocument('en', variant, intent);
    }
  }

  private normalizeVariants(phrase: string): string[] {
    const lower = phrase.toLowerCase();
    const base = lower.replace(/[-_]/g, ' ');

    const withHyphen = base.replace(/\s+/g, '-');
    const withUnderscore = base.replace(/\s+/g, '_');

    // Return unique variants
    return Array.from(new Set([base, withHyphen, withUnderscore]));
  }

  private generateEntitySynonyms(
    rawGroups: Record<string, string[]>,
  ): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const [entityType, values] of Object.entries(rawGroups)) {
      const expanded = new Set<string>();

      for (const val of values) {
        for (const variant of this.normalizeVariants(val)) {
          expanded.add(variant);
        }
      }

      result[entityType] = Array.from(expanded);
    }

    return result;
  }

  async initializeNlpManager() {
    if (!this.manager) {
      this.manager = new NlpManager({
        languages: ['en'],
        // Crucially, force NER to be active even if you don't explicitly link entities to intents
        forceNER: true,
        ner: {
          threshold: 0.8, // Adjust threshold for accuracy vs. recall. 1.0 for exact matches.
          // builtinWhitelist: [], // Use this if you want to disable built-in entities like dates, numbers etc.
        },
      });

      // --- Add Intent Classification Training Data (as before) ---
      // This helps in general classification and provides context for features

      for (const [entityType, features] of Object.entries(entityGroups)) {
        const expandedEntityGroups = this.generateEntitySynonyms(features);
        const intent = `feature.${entityType.substring(0, entityType.lastIndexOf('_'))}`;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [canonicalName, synonyms] of Object.entries(
          expandedEntityGroups,
        )) {
          this.addDocumentWithVariants(synonyms, intent);
        }
      }

      // --- Add Named Entities (NER) ---
      // This is the core for extracting specific features.
      for (const [entityType, features] of Object.entries(entityGroups)) {
        const expandedEntityGroups = this.generateEntitySynonyms(features);

        for (const [canonicalName, synonyms] of Object.entries(
          expandedEntityGroups,
        )) {
          this.manager.addNamedEntityText(
            entityType,
            canonicalName,
            ['en'],
            synonyms,
          );
        }
      }

      console.log('Training NLP Manager with intents and entities...');
      await this.manager.train();
      console.log('NLP Manager trained.');
    } else {
      console.log('NLP Manager already initialized.');
    }

    return this.manager;
  }

  async extractFeatureGroups(carListing: CarListing) {
    const description = carListing.description;

    const groupedFeatures = {
      performance: [],
      safety: [],
      comfort: [],
      technology: [],
      exterior: [],
      'interior trim': [],
      economy: [],
      drivetrain: [],
      certification: [],
      // Add other categories you defined
    };
    if (!description) {
      return {
        originalDescription: '',
        groupedFeatures: groupedFeatures,
        topIntent: null,
        entitiesFound: [], // For debugging/inspection
        // classifications: result.classifications, // For debugging/inspection
      };
    }

    if (!this.manager) {
      await this.initializeNlpManager();
    }
    const fixedText = this.fixConcatenatedWords(description);
    //console.log('fixedText', fixedText);
    const result = await this.manager.process('en', fixedText.toLowerCase());

    // Iterate through extracted entities
    if (result.entities && result.entities.length > 0) {
      result.entities.forEach((entity) => {
        // The entity.entity will be the type we defined (e.g., 'performance_feature')
        // The entity.sourceText is the actual text matched in the description.
        // The entity.option is the canonical name if defined as an enum.

        // Map entity types to your display group names
        const groupMap = {
          performance_feature: 'performance',
          safety_feature: 'safety',
          comfort_feature: 'comfort',
          technology_feature: 'technology',
          exterior_feature: 'exterior',
          interior_trim_feature: 'interior trim',
          economy: 'economy',
          drivetrain: 'drivetrain',
          certification: 'certification',
          // Add more as needed
        };

        const group = groupMap[entity.entity];
        if (group && !groupedFeatures[group].includes(entity.sourceText)) {
          groupedFeatures[group].push(entity.sourceText);
        }
      });
    }

    // You can also use the intent classification as a fallback or for general phrases
    // For example, if no specific entities are found but the overall intent is "performance"
    // you might want to flag the whole sentence.
    let topIntent = null;
    if (result.classifications && result.classifications.length > 0) {
      topIntent = result.classifications[0].intent;
      const topIntentScore = result.classifications[0].score;

      // Optionally, if the overall intent is strong but few entities were found,
      // you could add the whole description to that group, or try more advanced parsing.
      // For this example, we're focusing on extracted entities.
      // console.log('topIntentScore', topIntentScore);
    }

    return {
      originalDescription: description,
      groupedFeatures: groupedFeatures,
      topIntent: topIntent,
      entitiesFound: result.entities, // For debugging/inspection
      // classifications: result.classifications, // For debugging/inspection
    };
  }

  private helper(
    s: string,
    memo: { [x: string]: any },
    englishWords: Set<string>,
  ): string[] {
    if (s in memo) return memo[s];
    if (englishWords.has(s.toLowerCase())) return [s];

    const result: string[] = [];
    // use the longest possible word from the start
    const possibleWords: string[] = [];
    for (let i = 1; i < s.length; i++) {
      const prefix = s.slice(0, i).toLowerCase();
      if (englishWords.has(prefix)) {
        possibleWords.push(prefix);
      }
    }

    let newWord = '';
    if (possibleWords.length > 0) {
      possibleWords.sort((a: string, b: string) => b.length - a.length);
      result.push(possibleWords[0]);
      newWord = s.slice(possibleWords[0].length);
    }

    if (newWord) {
      //console.log('new word', newWord);
      const splitSuffix = this.helper(newWord, memo, englishWords);
      if (splitSuffix.length > 0) {
        result.push(...splitSuffix);
      }
    }

    memo[s] = result;
    return result;
  }

  private cleanText(
    textToClean: string,
    memo: { [x: string]: string[] },
  ): string[] {
    if (textToClean in memo) return memo[textToClean];
    const result = this.helper(textToClean, memo, new Set(englishWords));
    memo[textToClean] = result;
    return result;
  }

  // Main function to process full text
  private fixConcatenatedWords(text: string): string {
    const memo = {};
    return text
      .split(/\b/)
      .map((word) => {
        // Check only if it's a long single word
        if (/^[a-zA-Z]{8,}$/.test(word)) {
          const split = this.cleanText(word, memo);
          if (split.length > 1) {
            return split.join(' ');
          }
        }
        return word;
      })
      .join('');
  }
}
