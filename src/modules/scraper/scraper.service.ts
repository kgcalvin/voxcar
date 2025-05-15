import { Injectable, Logger } from '@nestjs/common';
import { CarsService } from '../cars/cars.service';
import { CarListing } from '../../database/car-listing.entity';
import { SlackService } from '../../common/services/slack.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

interface ScrapedCarData {
  make: string;
  model: string;
  year: string;
  price: string;
  type: string;
  transmission: string;
  mileage: string;
  engine: string;
  driveTrain: string;
  cylinders: string;
  exterior: string;
  interior: string;
  listing_url: string;
  description: string;
  location: string;
  image_urls: string;
  fuelType: string;
  // Add other fields as needed
  vin: string;
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly INACTIVATION_THRESHOLD = 0.85; // 85%

  constructor(
    private readonly carsService: CarsService,
    private readonly slackService: SlackService,
    private readonly configService: ConfigService,
  ) {}

  async processScrapedData(jobId: string): Promise<void> {
    try {
      // Fetch scraped data from webscraper.io
      const response = await axios.get<string>(
        `https://api.webscraper.io/api/v1/scraping-job/30614781/json?api_token=${this.configService.get('SCRAPER_API_TOKEN')}`,
      );
      const lines = response.data.trim().split('\n');
      const parsed = lines.map(
        (line: string) => JSON.parse(line) as ScrapedCarData,
      );
      const scrapedData = parsed;

      // Check for empty data
      if (!scrapedData || scrapedData.length === 0) {
        await this.slackService.sendActionRequired(
          `Scraping job ${jobId} returned empty data. Please investigate.`,
        );
        return;
      }

      // Process data based on the source (make)
      const processedCars = this.processDataByMake(scrapedData);

      // Handle deduplication and inactive cars
      await this.handleDeduplication(processedCars);

      // Save to database
      await this.saveProcessedCars(processedCars);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error processing scraped data for job ${jobId}:`,
        error,
      );
      await this.slackService.sendActionRequired(
        `Error processing scraping job ${jobId}: ${errorMessage}`,
      );
      throw error;
    }
  }

  private async handleDeduplication(
    processedCars: Partial<CarListing>[],
  ): Promise<void> {
    try {
      // Get all current active listings for the make
      const make = processedCars[0]?.make;
      if (!make) {
        this.logger.warn('No make found in processed cars');
        return;
      }

      const currentListings = await this.carsService.findActiveByMake(make);
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
        await this.slackService.sendActionRequired(
          `High number of cars being deactivated for ${make}. ${inactivationPercentage * 100}% of listings are being marked as inactive. Please verify scraping Job.`,
        );
      }

      // Deactivate cars that are no longer in the scraped data
      for (const car of carsToDeactivate) {
        await this.carsService.update(car.id, { isActive: false });
      }

      // Log deduplication results
      this.logger.log(
        `Deduplication complete for ${make}. ${carsToDeactivate.length} cars deactivated.`,
      );
    } catch (error) {
      this.logger.error('Error during deduplication:', error);
      await this.slackService.sendAlert(
        `Error during deduplication: ${error.message}`,
      );
    }
  }

  private processDataByMake(data: ScrapedCarData[]): Partial<CarListing>[] {
    const processedCars: Partial<CarListing>[] = [];

    for (const item of data) {
      try {
        const processedCar = this.processData(item);
        if (processedCar) {
          processedCars.push(processedCar);
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Error processing car data for make ${item.make}: ${errorMessage}`,
        );
      }
    }

    return processedCars;
  }

  private processData(data: ScrapedCarData): Partial<CarListing> {
    // engine| DriveTrain| Cylinders
    return {
      make: data.make,
      model: data.model,
      year: data.year,
      type: data.type,
      fuelType: data.fuelType,
      transmission: data.transmission,
      price: data.price,
      mileage: data.mileage,
      engine: data.engine,
      driveTrain: data.driveTrain,
      cylinders: data.cylinders,
      exterior: data.exterior,
      interior: data.interior,
      listing_url: data.listing_url,
      description: data.description,
      location: data.location,
      image_urls: data.image_urls ? data.image_urls.split('|') : [],
      // ... other unique fields
    };
  }

  private async saveProcessedCars(cars: Partial<CarListing>[]): Promise<void> {
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
          await this.carsService.create(car);
        }
      } catch (error) {
        this.logger.error(`Error saving car:`, error);
      }
    }
  }
}
