import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CarsService } from '../src/modules/cars/cars.service';
import { Logger } from '@nestjs/common';

export async function cleanAudiImageUrls() {
  const logger = new Logger('CleanAudiImageUrls');

  try {
    logger.log(
      'Starting to clean image URLs for AUDI cars with USED condition...',
    );

    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get services
    const carsService = app.get(CarsService);

    // Get all AUDI cars with USED condition
    logger.log('Fetching AUDI cars with USED condition...');
    const audiUsedCars = await carsService.getAudiUsedCars();

    logger.log(`Found ${audiUsedCars.length} AUDI cars with USED condition`);

    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const car of audiUsedCars) {
      try {
        processedCount++;

        // Check if car has image_urls
        if (!car.image_urls || car.image_urls.length === 0) {
          logger.debug(`Car ${car.id} has no image URLs, skipping...`);
          continue;
        }

        // Filter out non-URL values
        const originalUrls = [...car.image_urls];
        const cleanedUrls = car.image_urls.filter(
          (url) => typeof url === 'string' && url.startsWith('https://'),
        );

        // Check if any URLs were removed
        if (cleanedUrls.length !== originalUrls.length) {
          logger.log(
            `Car ${car.id} (${car.year} ${car.make} ${car.model}): Removed ${originalUrls.length - cleanedUrls.length} invalid URLs`,
          );
          logger.debug(`Original URLs: ${JSON.stringify(originalUrls)}`);
          logger.debug(`Cleaned URLs: ${JSON.stringify(cleanedUrls)}`);

          // Update the car with cleaned URLs
          await carsService.update(car.id, {
            image_urls: cleanedUrls,
          });

          updatedCount++;
        } else {
          logger.debug(`Car ${car.id} already has clean URLs, skipping...`);
        }

        // Log progress every 50 cars
        if (processedCount % 50 === 0) {
          logger.log(
            `Progress: ${processedCount}/${audiUsedCars.length} cars processed, ${updatedCount} updated, ${errorCount} errors`,
          );
        }
      } catch (error) {
        errorCount++;
        logger.error(`Error processing car ${car.id}:`, error);

        // Continue with next car even if one fails
        continue;
      }
    }

    logger.log('=== CLEANING COMPLETE ===');
    logger.log(`Total cars processed: ${processedCount}`);
    logger.log(`Cars updated: ${updatedCount}`);
    logger.log(`Errors encountered: ${errorCount}`);

    await app.close();
  } catch (error) {
    logger.error('Fatal error in cleanAudiImageUrls:', error);
    process.exit(1);
  }
}

// Run the script
cleanAudiImageUrls()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
