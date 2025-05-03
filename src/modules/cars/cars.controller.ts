import { Controller, Get } from '@nestjs/common';
import { CarsService } from './cars.service';
import { CarListing } from '../../database/car-listing.entity';

@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get()
  async findAll(): Promise<CarListing[]> {
    return this.carsService.findAll();
  }
}
