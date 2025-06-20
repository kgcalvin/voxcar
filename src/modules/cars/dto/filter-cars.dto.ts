export class FilterCarsDto {
  page: number;
  limit: number;

  active?: boolean;
  condition?: string;
  year?: string;
  make?: string;
  location?: string;
  type?: string;
  model?: string;
}
