import { Injectable } from '@nestjs/common';
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
}
