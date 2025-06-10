import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { CarListing } from '../../database/car-listing.entity';
import { FilterCarsDto } from './dto/filter-cars.dto';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(CarListing)
    private readonly carListingRepository: Repository<CarListing>,
  ) {}

  async findAll(
    filters: FilterCarsDto,
  ): Promise<PaginatedResponse<CarListing>> {
    const where: FindOptionsWhere<CarListing> = {};

    // Set default value for pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    if (filters.active) where.isActive = filters.active;
    if (filters.condition) where.condition = filters.condition;
    if (filters.year) where.year = filters.year;
    if (filters.make) where.make = filters.make;
    if (filters.location) where.location = filters.location;
    if (filters.type) where.type = filters.type;

    const [cars, total] = await this.carListingRepository.findAndCount({
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        type: true,
        fuel_type: true,
        transmission: true,
        price: true,
        mileage: true,
        engine: true,
        cylinders: true,
        drive_train: true,
        exterior: true,
        interior: true,
        isActive: true,
        listing_url: true,
        description: true,
        location: true,
        condition: true,
        image_urls: true,
        vin: true,
      },
      where,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: cars,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findActiveExistingCars(
    make: string,
    location: string,
    condition: string,
  ): Promise<CarListing[]> {
    return this.carListingRepository.find({
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        type: true,
        fuel_type: true,
        transmission: true,
        price: true,
        mileage: true,
        engine: true,
        cylinders: true,
        drive_train: true,
        exterior: true,
        interior: true,
        isActive: true,
        listing_url: true,
        description: true,
        location: true,
        condition: true,
        image_urls: true,
        vin: true,
      },
      where: {
        make,
        condition,
        location,
        isActive: true,
      },
    });
  }

  async findByListingUrl(listing_url: string): Promise<CarListing | null> {
    return this.carListingRepository.findOne({
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        type: true,
        fuel_type: true,
        transmission: true,
        price: true,
        mileage: true,
        engine: true,
        cylinders: true,
        drive_train: true,
        exterior: true,
        interior: true,
        isActive: true,
        listing_url: true,
        description: true,
        location: true,
        condition: true,
        image_urls: true,
        vin: true,
      },
      where: { listing_url },
    });
  }

  async create(carData: Partial<CarListing>): Promise<CarListing> {
    const car = this.carListingRepository.create(carData);
    return this.carListingRepository.save(car);
  }

  async update(id: string, carData: Partial<CarListing>): Promise<CarListing> {
    await this.carListingRepository.update(id, carData);
    const updatedCar = await this.carListingRepository.findOne({
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        type: true,
        fuel_type: true,
        transmission: true,
        price: true,
        mileage: true,
        engine: true,
        cylinders: true,
        drive_train: true,
        exterior: true,
        interior: true,
        isActive: true,
        listing_url: true,
        description: true,
        location: true,
        condition: true,
        image_urls: true,
        vin: true,
      },
      where: { id },
    });
    if (!updatedCar) {
      throw new NotFoundException(`Car with ID ${id} not found`);
    }
    return updatedCar;
  }

  async findOne(id: string): Promise<CarListing> {
    const car = await this.carListingRepository.findOne({
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        type: true,
        fuel_type: true,
        transmission: true,
        price: true,
        mileage: true,
        engine: true,
        cylinders: true,
        drive_train: true,
        exterior: true,
        interior: true,
        isActive: true,
        listing_url: true,
        description: true,
        location: true,
        condition: true,
        image_urls: true,
        vin: true,
      },
      where: { id },
    });

    if (!car) {
      throw new NotFoundException(`Car with ID ${id} not found`);
    }

    return car;
  }

  async getUniqueFilters(): Promise<{
    locations: string[];
    types: string[];
    makes: string[];
    years: string[];
  }> {
    const [locations, types, makes, years] = await Promise.all([
      this.carListingRepository
        .createQueryBuilder('car')
        .select('DISTINCT car.location', 'location')
        .where('car.isActive = :isActive', { isActive: true })
        .getRawMany(),
      this.carListingRepository
        .createQueryBuilder('car')
        .select('DISTINCT car.type', 'type')
        .where('car.isActive = :isActive', { isActive: true })
        .getRawMany(),
      this.carListingRepository
        .createQueryBuilder('car')
        .select('DISTINCT car.make', 'make')
        .where('car.isActive = :isActive', { isActive: true })
        .getRawMany(),
      this.carListingRepository
        .createQueryBuilder('car')
        .select('DISTINCT car.year', 'year')
        .where('car.isActive = :isActive', { isActive: true })
        .getRawMany(),
    ]);

    return {
      locations: locations
        .map((l: { location: string }) => l.location)
        .filter(Boolean),
      types: types.map((t: { type: string }) => t.type).filter(Boolean),
      makes: makes.map((m: { make: string }) => m.make).filter(Boolean),
      years: years.map((y: { year: string }) => y.year).filter(Boolean),
    };
  }
}
