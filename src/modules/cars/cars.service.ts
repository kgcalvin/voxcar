import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarListing } from '../../database/car-listing.entity';

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(CarListing)
    private readonly carListingRepository: Repository<CarListing>,
  ) {}

  async findAll(): Promise<CarListing[]> {
    return this.carListingRepository.find();
  }

  async findActiveByMake(make: string): Promise<CarListing[]> {
    return this.carListingRepository.find({
      where: {
        make,
        isActive: true,
      },
    });
  }

  async findByListingUrl(listing_url: string): Promise<CarListing | null> {
    return this.carListingRepository.findOne({
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
      where: { id },
    });
    if (!updatedCar) {
      throw new NotFoundException(`Car with ID ${id} not found`);
    }
    return updatedCar;
  }
}
