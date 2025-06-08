import { Controller, Get, Query, Param } from '@nestjs/common';
import { CarsService } from './cars.service';
import { CarListing } from '../../database/car-listing.entity';
import { FilterCarsDto } from './dto/filter-cars.dto';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get()
  async findAll(
    @Query() filters: FilterCarsDto,
  ): Promise<PaginatedResponse<CarListing>> {
    return this.carsService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CarListing> {
    return this.carsService.findOne(id);
  }
}
