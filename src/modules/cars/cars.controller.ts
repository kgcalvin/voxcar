import { Controller, Get, Query, Param } from '@nestjs/common';
import { CarsService } from './cars.service';
import { CarListing } from '../../database/car-listing.entity';
import { FilterCarsDto } from './dto/filter-cars.dto';
import { plainToInstance } from 'class-transformer';

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
    @Query() query: Record<string, any>,
  ): Promise<PaginatedResponse<CarListing>> {
    const filters = plainToInstance(FilterCarsDto, query);
    return this.carsService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CarListing> {
    return this.carsService.findOne(id);
  }
}
