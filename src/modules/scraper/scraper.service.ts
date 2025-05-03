import { Injectable, Logger } from '@nestjs/common';
import { CarsService } from '../cars/cars.service';
import { CarListing } from '../../database/car-listing.entity';
import { SlackService } from '../../common/services/slack.service';
import axios from 'axios';

interface ScrapedCarData {
  url: string;
  make: string;
  model: string;
  year: number;
  price: number;
  // Add other fields as needed
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly INACTIVATION_THRESHOLD = 0.85; // 85%

  constructor(
    private readonly carsService: CarsService,
    private readonly slackService: SlackService,
  ) {}

  async processScrapedData(jobId: string): Promise<void> {
    try {
      // Fetch scraped data from webscraper.io
      const response = await axios.get(
        `https://api.webscraper.io/api/v1/scraping-job/${jobId}/jsone`,
      );
      const scrapedData = response.data;

      // Check for empty data
      if (!scrapedData || scrapedData.length === 0) {
        await this.slackService.sendActionRequired(
          `Scraping job ${jobId} returned empty data. Please investigate.`,
        );
        return;
      }

      // Process data based on the source (make)
      const processedCars = await this.processDataByMake(scrapedData);

      // Handle deduplication and inactive cars
      await this.handleDeduplication(processedCars);

      // Save to database
      await this.saveProcessedCars(processedCars);
    } catch (error) {
      this.logger.error(
        `Error processing scraped data for job ${jobId}:`,
        error,
      );
      await this.slackService.sendActionRequired(
        `Error processing scraping job ${jobId}: ${error.message}`,
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
      const currentUrls = new Set(currentListings.map((car) => car.listingUrl));
      const newUrls = new Set(processedCars.map((car) => car.listingUrl));

      // Find cars that are no longer in the scraped data
      const carsToDeactivate = currentListings.filter(
        (car) => !newUrls.has(car.listingUrl),
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

  private async processDataByMake(
    data: ScrapedCarData[],
  ): Promise<Partial<CarListing>[]> {
    const processedCars: Partial<CarListing>[] = [];

    for (const item of data) {
      // Determine the make from the URL or data
      const make = this.determineMake(item.url);

      // Process data based on make
      const processedCar = await this.processCarData(make, item);
      if (processedCar) {
        processedCars.push(processedCar);
      }
    }

    return processedCars;
  }

  private determineMake(url: string): string {
    // Implement logic to determine make from URL
    if (url.includes('bmw')) return 'BMW';
    if (url.includes('mazda')) return 'Mazda';
    if (url.includes('audi')) return 'Audi';
    return 'Unknown';
  }

  private async processCarData(
    make: string,
    data: ScrapedCarData,
  ): Promise<Partial<CarListing> | null> {
    try {
      // Process data based on make
      switch (make.toLowerCase()) {
        case 'bmw':
          return this.processBmwData(data);
        case 'mazda':
          return this.processMazdaData(data);
        case 'audi':
          return this.processAudiData(data);
        default:
          this.logger.warn(`No processor found for make: ${make}`);
          return null;
      }
    } catch (error) {
      this.logger.error(`Error processing car data for make ${make}:`, error);
      return null;
    }
  }

  private processBmwData(data: ScrapedCarData): Partial<CarListing> {
    return {
      make: 'BMW',
      model: data.model,
      year: data.year,
      price: data.price,
      listingUrl: data.url,
      isActive: true,
      // ... other fields
    };
  }

  private processMazdaData(data: ScrapedCarData): Partial<CarListing> {
    return {
      make: 'Mazda',
      model: data.model,
      year: data.year,
      price: data.price,
      listingUrl: data.url,
      isActive: true,
      // ... other fields
    };
  }

  private processAudiData(data: ScrapedCarData): Partial<CarListing> {
    return {
      make: 'Audi',
      model: data.model,
      year: data.year,
      price: data.price,
      listingUrl: data.url,
      isActive: true,
      // ... other fields
    };
  }

  private async saveProcessedCars(cars: Partial<CarListing>[]): Promise<void> {
    for (const car of cars) {
      try {
        if (!car.listingUrl) continue;
        // Check if car already exists
        const existingCar = await this.carsService.findByListingUrl(
          car.listingUrl,
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
