import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CarsService } from '../src/modules/cars/cars.service';
import { NlpService } from '../src/modules/cars/nlp.service';
import { Logger } from '@nestjs/common';
import * as cron from 'node-cron';

async function addGroupedFeaturesToExistingCars() {
  const logger = new Logger('AddGroupedFeatures');

  try {
    logger.log('Starting to add grouped features to existing cars...');

    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get services
    const carsService = app.get(CarsService);
    const nlpService = app.get(NlpService);

    // Initialize NLP service
    await nlpService.initializeNlpManager();

    // Get all cars from database (in batches to avoid memory issues)
    const batchSize = 100;
    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    logger.log('Fetching cars from database...');

    // Get total count first
    const totalCars = await carsService.getTotalCount();
    logger.log(`Total cars to process: ${totalCars}`);

    // Process in batches
    for (let offset = 0; offset < totalCars; offset += batchSize) {
      const cars = await carsService.getCarsBatch(offset, batchSize);

      logger.log(
        `Processing batch ${Math.floor(offset / batchSize) + 1}/${Math.ceil(totalCars / batchSize)} (${cars.length} cars)`,
      );

      for (const car of cars) {
        try {
          processedCount++;

          // Skip if already has grouped features
          if (car.grouped_features) {
            logger.debug(
              `Car ${car.id} already has grouped features, skipping...`,
            );
            continue;
          }

          // Extract grouped features using NLP service
          const nlpResult = await nlpService.extractFeatureGroups(car);

          // Update car with grouped features
          await carsService.update(car.id, {
            grouped_features: nlpResult.groupedFeatures,
          });

          updatedCount++;

          // Log progress every 50 cars
          if (processedCount % 50 === 0) {
            logger.log(
              `Progress: ${processedCount}/${totalCars} cars processed, ${updatedCount} updated, ${errorCount} errors`,
            );
          }
        } catch (error) {
          errorCount++;
          logger.error(`Error processing car ${car.id}:`, error);

          // Continue with next car even if one fails
          continue;
        }
      }

      // Small delay between batches to avoid overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    logger.log('=== PROCESSING COMPLETE ===');
    logger.log(`Total cars processed: ${processedCount}`);
    logger.log(`Cars updated: ${updatedCount}`);
    logger.log(`Errors encountered: ${errorCount}`);

    await app.close();
  } catch (error) {
    logger.error('Fatal error in addGroupedFeaturesToExistingCars:', error);
    process.exit(1);
  }
}

export function runAddGroupFeaturesCron() {
  // Schedule the script to run at 8:00 AM every day
  console.log('Scheduling grouped features update task for 23:00 AM daily...');
  cron.schedule('15 11,23 * * *', async () => {
    console.log('Starting scheduled grouped features update...');
    await addGroupedFeaturesToExistingCars()
      .then(() => {
        console.log('Scheduled task completed successfully');
      })
      .catch((error) => {
        console.error('Scheduled task failed:', error);
      });
  });
}
