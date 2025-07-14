import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { CarListing } from '../../database/car-listing.entity'; // Adjust the import path as necessary
import { NlpService } from './nlp.service';

@Module({
  imports: [TypeOrmModule.forFeature([CarListing])],
  controllers: [CarsController],
  providers: [CarsService, NlpService],
  exports: [CarsService, NlpService],
})
export class CarsModule {}
