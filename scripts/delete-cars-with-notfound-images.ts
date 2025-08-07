import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CarsService } from '../src/modules/cars/cars.service';
import { Logger } from '@nestjs/common';

export async function deleteCarsWithNotFoundImages() {
  const logger = new Logger('DeleteCarsWithNotFoundImages');

  try {
    logger.log(
      'Starting to find and delete cars with notfound.jpg images and Ford cars with photo_unavailable_640.png...',
    );

    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get services
    const carsService = app.get(CarsService);

    // Get all cars with notfound.jpg images
    logger.log('Fetching cars with notfound.jpg images...');
    const carsWithNotFoundImages =
      await carsService.getCarsWithNotFoundImages();

    // Get Ford cars with photo_unavailable_640.png images
    logger.log('Fetching Ford cars with photo_unavailable_640.png images...');
    const fordCarsWithUnavailableImages =
      await carsService.getFordCarsWithUnavailableImages();

    // Combine both lists
    const allCarsToDelete = [
      ...carsWithNotFoundImages,
      ...fordCarsWithUnavailableImages,
    ];

    logger.log(
      `Found ${carsWithNotFoundImages.length} cars with notfound.jpg images`,
    );
    logger.log(
      `Found ${fordCarsWithUnavailableImages.length} Ford cars with photo_unavailable_640.png images`,
    );
    logger.log(`Total cars to delete: ${allCarsToDelete.length}`);

    if (allCarsToDelete.length === 0) {
      logger.log('No cars with problematic images found. Nothing to delete.');
      await app.close();
      return;
    }

    let processedCount = 0;
    let deletedCount = 0;
    let errorCount = 0;

    // Log the cars that will be deleted
    logger.log('Cars that will be deleted:');
    allCarsToDelete.forEach((car, index) => {
      const reason = car.image_urls?.some((url) => url.includes('notfound.jpg'))
        ? 'notfound.jpg'
        : 'photo_unavailable_640.png';
      logger.log(
        `${index + 1}. ${car.year} ${car.make} ${car.model} (${car.id}) - ${car.listing_url} [${reason}]`,
      );
    });

    // Ask for confirmation (in a real scenario, you might want to add a confirmation prompt)
    logger.log(
      `\n⚠️  WARNING: About to delete ${allCarsToDelete.length} cars with problematic images`,
    );
    logger.log('This action cannot be undone. Proceeding with deletion...');

    for (const car of allCarsToDelete) {
      try {
        processedCount++;

        logger.log(
          `Deleting car ${car.id} (${car.year} ${car.make} ${car.model})...`,
        );

        // Delete the car
        await carsService.delete(car.id);

        deletedCount++;
        logger.log(`✅ Successfully deleted car ${car.id}`);

        // Log progress every 10 cars
        if (processedCount % 10 === 0) {
          logger.log(
            `Progress: ${processedCount}/${allCarsToDelete.length} cars processed, ${deletedCount} deleted, ${errorCount} errors`,
          );
        }
      } catch (error) {
        errorCount++;
        logger.error(`Error deleting car ${car.id}:`, error);

        // Continue with next car even if one fails
        continue;
      }
    }

    logger.log('=== DELETION COMPLETE ===');
    logger.log(`Total cars processed: ${processedCount}`);
    logger.log(`Cars deleted: ${deletedCount}`);
    logger.log(`Errors encountered: ${errorCount}`);

    if (deletedCount > 0) {
      logger.log(
        `\n🎉 Successfully deleted ${deletedCount} cars with problematic images`,
      );
    }

    await app.close();
  } catch (error) {
    logger.error('Fatal error in deleteCarsWithNotFoundImages:', error);
    process.exit(1);
  }
}

// Run the script
deleteCarsWithNotFoundImages()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
