import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CarsService } from '../src/modules/cars/cars.service';
import { Logger } from '@nestjs/common';

export async function fixFordImageUrls() {
  const logger = new Logger('FixFordImageUrls');

  try {
    logger.log(
      'Starting to fix image URLs for FORD cars with NEW condition...',
    );

    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get services
    const carsService = app.get(CarsService);

    // Get all FORD cars with NEW condition
    logger.log('Fetching FORD cars with NEW condition...');
    const fordNewCars = await carsService.getFordNewCars();

    logger.log(`Found ${fordNewCars.length} FORD cars with NEW condition`);

    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const car of fordNewCars) {
      try {
        processedCount++;

        // Check if car has image_urls
        if (!car.image_urls || car.image_urls.length === 0) {
          logger.debug(`Car ${car.id} has no image URLs, skipping...`);
          continue;
        }

        // Check if any URLs need fixing (start with /assets/)
        const needsFixing = car.image_urls.some(
          (url) => typeof url === 'string' && url.startsWith('/assets/'),
        );

        if (!needsFixing) {
          logger.debug(`Car ${car.id} has no /assets/ URLs, skipping...`);
          continue;
        }

        // Fix the URLs by prefixing with https://www.pierreford.com/
        const originalUrls = [...car.image_urls];
        const fixedUrls = car.image_urls.map((url) => {
          if (typeof url === 'string' && url.startsWith('/assets/')) {
            return `https://www.pierreford.com${url}`;
          }
          return url;
        });

        // Check if any URLs were actually changed
        const changedUrls = fixedUrls.filter(
          (url, index) => url !== originalUrls[index],
        );

        if (changedUrls.length > 0) {
          logger.log(
            `Car ${car.id} (${car.year} ${car.make} ${car.model}): Fixed ${changedUrls.length} URLs`,
          );
          logger.debug(`Original URLs: ${JSON.stringify(originalUrls)}`);
          logger.debug(`Fixed URLs: ${JSON.stringify(fixedUrls)}`);

          // Update the car with fixed URLs
          await carsService.update(car.id, {
            image_urls: fixedUrls,
          });

          updatedCount++;
        } else {
          logger.debug(`Car ${car.id} URLs were not changed, skipping...`);
        }

        // Log progress every 50 cars
        if (processedCount % 50 === 0) {
          logger.log(
            `Progress: ${processedCount}/${fordNewCars.length} cars processed, ${updatedCount} updated, ${errorCount} errors`,
          );
        }
      } catch (error) {
        errorCount++;
        logger.error(`Error processing car ${car.id}:`, error);

        // Continue with next car even if one fails
        continue;
      }
    }

    logger.log('=== URL FIXING COMPLETE ===');
    logger.log(`Total cars processed: ${processedCount}`);
    logger.log(`Cars updated: ${updatedCount}`);
    logger.log(`Errors encountered: ${errorCount}`);

    if (updatedCount > 0) {
      logger.log(
        `\n🎉 Successfully fixed image URLs for ${updatedCount} FORD cars`,
      );
    } else {
      logger.log(`\nℹ️  No FORD cars with /assets/ URLs found to fix`);
    }

    await app.close();
  } catch (error) {
    logger.error('Fatal error in fixFordImageUrls:', error);
    process.exit(1);
  }
}

// Run the script
fixFordImageUrls()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
