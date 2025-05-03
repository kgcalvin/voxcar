import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('car_listings')
export class CarListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  make: string;

  @Column()
  model: string;

  @Column()
  year: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2 })
  priceWithAccessories: number;

  @Column()
  mileage: number;

  @Column()
  color: string;

  @Column()
  fuelType: string;

  @Column()
  fuelEfficiency: string;

  @Column()
  engine: string;

  @Column()
  transmission: string;

  @Column({ nullable: true })
  horsePower: number;

  @Column({ nullable: true })
  driveTrain: string;

  @Column({ nullable: true })
  interior: string;

  @Column()
  exterior: string;

  @Column()
  cylinders: number;

  @Column('simple-array')
  imageUrls: string[];

  @Column()
  listingUrl: string;

  @Column()
  vin: string;

  @Column()
  stock: string;

  @Column('text')
  description: string;

  @Column({ default: true })
  isActive: boolean;
}
