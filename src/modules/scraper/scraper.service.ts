import { Injectable, Logger } from '@nestjs/common';
import { CarsService } from '../cars/cars.service';
import { CarListing } from '../../database/car-listing.entity';
import { SlackService } from '../../common/services/slack.service';
import { AiService } from '../../common/services/ai.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

interface ScrapedCarData {
  make?: string;
  model?: string;
  year?: string;
  price?: string;
  type?: string;
  transmission?: string;
  mileage?: string;
  engine?: string;
  cylinders?: string;
  exterior?: string;
  interior?: string;
  listing_url?: string;
  description?: string;
  location?: string;
  image_urls?: string;
  condition?: string;
  vin?: string;
  drive_train?: string;
  fuel_type?: string;
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly INACTIVATION_THRESHOLD = 0.85; // 85%

  constructor(
    private readonly carsService: CarsService,
    private readonly slackService: SlackService,
    private readonly configService: ConfigService,
    private readonly aiService: AiService,
  ) {}
  async processScrapedCars(jobId: string, siteMapId: string): Promise<void> {
    try {
      // Fetch scraped data from webscraper.io
      const response = await axios.get<string>(
        `https://api.webscraper.io/api/v1/scraping-job/${jobId}/json?api_token=${this.configService.get('SCRAPER_API_TOKEN')}`,
      );
      const lines = response.data.trim().split('\n');
      const parsed = lines.map(
        (line: string) => JSON.parse(line) as ScrapedCarData,
      );

      // Check for empty data
      if (!parsed || parsed.length === 0) {
        await this.slackService.sendNotification(
          `Scraping job ${jobId} returned empty data. Please investigate.`,
        );
        return;
      }

      // Process data to make it compatible with CarListing schema
      const processedCars = await this._cleanScrapedData(parsed, jobId);

      // Handle deduplication and inactive cars
      void this._handleCarDeactivation(processedCars, jobId, siteMapId);

      // Save to database
      void this._saveProcessedCars(processedCars, siteMapId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error processing scraped data for job ${jobId}:`,
        error,
      );
      await this.slackService.sendNotification(
        `Error processing scraping job ${jobId}: ${errorMessage}`,
      );
      throw error;
    }
  }

  private async _cleanScrapedData(
    data: ScrapedCarData[],
    jobId: string,
  ): Promise<Partial<CarListing>[]> {
    const processedCars: Partial<CarListing>[] = [];
    const carsFailedToProcess: ScrapedCarData[] = [];
    const carsWithNoImages: ScrapedCarData[] = [];

    // Filter out cars without listing_url first
    const validCars = data.filter((car) => car.listing_url && car.year);

    for (const item of validCars) {
      try {
        const processedCar = await this._mapToCarListingSchema(item);
        if (processedCar && processedCar.image_urls!.length == 0) {
          carsWithNoImages.push(item);
          this.logger.log(
            `Processed car for make ${item.listing_url} has no images`,
          );
          continue;
        }
        if (processedCar) {
          processedCars.push(processedCar);
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Error processing car data for make ${item.make}: ${errorMessage}`,
        );
        carsFailedToProcess.push(item);
      }
    }
    if (carsFailedToProcess.length > 0) {
      void this.slackService.sendNotification(
        `⚠️ *Scraping Issues Detected*\n` +
          `*${carsFailedToProcess.length}* cars failed to process.\n` +
          `*Affected Listings:*(Limited to only 50 listings to avoid slack message size crashing. Please check the webscraper.io job with ID: *${jobId}* for details.\n` +
          carsFailedToProcess
            .slice(0, 50)
            .map(
              (item: ScrapedCarData) =>
                `• <${item.listing_url}|${item.make || 'Unknown'} ${item.model || ''}>`,
            )
            .join('\n') +
          '\n\n' +
          `Please check the webscraper.io job with ID: *${jobId}* for details.`,
      );
    }

    if (carsWithNoImages.length > 0) {
      void this.slackService.sendNotification(
        `📸 *Missing Images Alert*\n` +
          `*${carsWithNoImages.length} out of ${validCars.length} cars were scraped without images.\n` +
          `*Affected Listings:*(Limited to only 50 listings to avoid slack message size crashing. Please check the webscraper.io job with ID: *${jobId}* for details.\n` +
          carsWithNoImages
            .slice(0, 50)
            .map(
              (item: ScrapedCarData) =>
                `• <${item.listing_url}|${item.make || 'Unknown'} ${item.model || ''}>`,
            )
            .join('\n') +
          '\n\n' +
          `Please check the webscraper.io job with ID: *${jobId}* for details.`,
      );
    }

    return processedCars;
  }

  private async _mapToCarListingSchema(
    data: ScrapedCarData,
  ): Promise<Partial<CarListing>> {
    const currentYear = new Date().getFullYear();
    const carYear = parseInt(data.year || '0');
    const condition =
      carYear >= currentYear - 1 ? data.condition?.toUpperCase() : 'USED';

    // Process description through AI service
    // let processedDescription = data.description || '';
    // if (data.description) {
    //   try {
    //     processedDescription = await this.aiService.processCarDescription(
    //       data.description,
    //     );
    //   } catch (error) {
    //     this.logger.error('Error processing description with AI:', error);
    //     // Fallback to raw description if AI processing fails
    //     processedDescription = data.description;
    //   }
    // }

    return {
      make: data.make?.toUpperCase(),
      model: data.model,
      year: data.year,
      type: data.type?.toUpperCase(),
      transmission: data.transmission,
      price: data.price,
      mileage: data.mileage,
      engine: data.engine,
      cylinders: data.cylinders,
      exterior: data.exterior,
      interior: data.interior,
      listing_url: data.listing_url,
      description: data.description,
      location: data.location?.toUpperCase(),
      image_urls: data.image_urls ? data.image_urls.split('|') : [],
      vin: data.vin,
      condition: condition,
      drive_train: data.drive_train,
      fuel_type: data.fuel_type,
    };
  }

  private async _handleCarDeactivation(
    processedCars: Partial<CarListing>[],
    jobId: string,
    siteMapId: string,
  ): Promise<void> {
    // Get all current active listings for the Listing website using sitemap Id
    const currentListings =
      await this.carsService.findActiveExistingCars(siteMapId);
    const newUrls = new Set(processedCars.map((car) => car.listing_url));

    // Find cars that are no longer in the scraped data
    const carsToDeactivate = currentListings.filter(
      (car) => !newUrls.has(car.listing_url),
    );

    // Calculate inactivation percentage
    const inactivationPercentage =
      carsToDeactivate.length / currentListings.length;

    // If more than 85% of cars are being deactivated, send alert
    if (inactivationPercentage > this.INACTIVATION_THRESHOLD) {
      // THrow an error to stop the process
      throw new Error(
        `High number of cars being deactivated for . ${inactivationPercentage * 100}% of listings are being marked as inactive.
         Please verify scraping Job. ${jobId} on webscraper.io.`,
      );
    }

    // Deactivate cars that are no longer in the scraped data
    for (const car of carsToDeactivate) {
      await this.carsService.update(car.id, { isActive: false });
    }
    if (carsToDeactivate.length) {
      void this.slackService.sendNotification(
        `⚠️ *Scraping Issues Detected*\n` +
          `*${carsToDeactivate.length}* cars are no longer avaliable on listing site.\n` +
          `*Deactivated Listings:* (Limited to only 50 listings to avoid slack message size crashing.)\n` +
          carsToDeactivate
            .slice(0, 50)
            .map(
              (item: Partial<CarListing>) =>
                `• <${item.listing_url}|${item.make || 'Unknown'} ${item.model || ''}>`,
            )
            .join('\n') +
          '\n\n' +
          `Please check the webscraper.io job with ID: *${jobId}* for details.`,
      );
    }

    // Log deduplication results
    this.logger.log(
      `Deduplication complete for . ${carsToDeactivate.length} cars deactivated.`,
    );
  }

  private async _saveProcessedCars(
    cars: Partial<CarListing>[],
    sitemap_id: string,
  ): Promise<void> {
    for (const car of cars) {
      try {
        if (!car.listing_url) continue;
        // Check if car already exists
        const existingCar = await this.carsService.findByListingUrl(
          car.listing_url,
        );
        if (existingCar) {
          // Update existing car
          await this.carsService.update(existingCar.id, {
            ...car,
            isActive: true,
          });
        } else {
          // Create new car
          await this.carsService.create({
            ...car,
            sitemap_id,
          });
        }
      } catch (error) {
        this.logger.error(`Error saving car:`, error);
      }
    }
  }
}
