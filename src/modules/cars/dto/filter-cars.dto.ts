export class FilterCarsDto {
  page: number = 1;
  limit: number = 10;

  active?: boolean;
  condition?: string;
  year?: string;
  make?: string;
  location?: string;
  type?: string;
}
