import { Controller, Get, Query, Param } from '@nestjs/common';
import { CarsService } from './cars.service';
import { CarListing } from '../../database/car-listing.entity';
import { FilterCarsDto } from './dto/filter-cars.dto';
import { NlpService } from './nlp.service';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Controller('cars')
export class CarsController {
  constructor(
    private readonly carsService: CarsService,
    private readonly nlpService: NlpService,
  ) {}

  @Get()
  async findAll(
    @Query() filters: FilterCarsDto,
  ): Promise<PaginatedResponse<CarListing>> {
    return this.carsService.findAll(filters);
  }

  @Get('filters')
  async getUniqueFilters(): Promise<{
    locations: string[];
    types: string[];
    makes: string[];
    years: string[];
    modelsByMake: { [key: string]: string[] };
  }> {
    return this.carsService.getUniqueFilters();
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<CarListing & { groupedFeatures: { [x: string]: string[] } }> {
    const carListing = await this.carsService.findOne(id);
    const groups = await this.nlpService.extractFeatureGroups(carListing);
    return {
      ...carListing,
      groupedFeatures: groups.groupedFeatures,
    };
  }
}
