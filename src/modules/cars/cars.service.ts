import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { CarListing } from '../../database/car-listing.entity';
import { FilterCarsDto } from './dto/filter-cars.dto';

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(CarListing)
    private readonly carListingRepository: Repository<CarListing>,
  ) {}

  async findAll(filters?: FilterCarsDto): Promise<CarListing[]> {
    const where: FindOptionsWhere<CarListing> = {};

    if (filters) {
      if (filters.active) where.isActive = filters.active;
      if (filters.condition) where.condition = filters.condition;
      if (filters.year) where.year = filters.year;
      if (filters.make) where.make = filters.make;
      if (filters.location) where.location = filters.location;
      if (filters.type) where.type = filters.type;
    }

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
      where,
    });
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
}
