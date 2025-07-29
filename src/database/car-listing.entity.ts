import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('car_listings')
export class CarListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  make: string;

  @Column()
  model: string;

  @Column()
  year: string;

  @Column()
  type: string;

  @Column()
  fuel_type: string;

  @Column()
  transmission: string;

  @Column()
  price: string;

  @Column()
  mileage: string;

  @Column()
  engine: string;

  @Column()
  cylinders: string;

  @Column({ nullable: true })
  drive_train: string;

  @Column()
  exterior: string;

  @Column()
  interior: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  listing_url: string;

  @Column('text')
  description: string;

  @Column('text')
  location: string;

  @Column('text')
  condition: string;

  @Column('simple-array')
  image_urls: string[];

  @Column('json', { nullable: true })
  grouped_features: {
    performance: string[];
    safety: string[];
    comfort: string[];
    technology: string[];
    exterior: string[];
    interior_trim: string[];
    economy: string[];
    drivetrain: string[];
    certification: string[];
  };

  // Additional fields That are unique for particular makes

  @Column()
  vin: string;

  @Column()
  sitemap_id: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
