/**
 * ListBrands Use Case
 */

import { IBrandRepository, BrandFilters, PaginatedResult } from '../../domain/repositories/BrandRepository';
import { Brand } from '../../domain/entities/Brand';

export interface ListBrandsInput {
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListBrandsOutput {
  brands: PaginatedResult<Brand>;
}

export class ListBrandsUseCase {
  constructor(private readonly brandRepository: IBrandRepository) {}

  async execute(input: ListBrandsInput): Promise<ListBrandsOutput> {
    const filters: BrandFilters = {
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      search: input.search,
    };

    const pagination = {
      page: input.page || 1,
      limit: input.limit || 20,
    };

    const brands = await this.brandRepository.findAll(filters, pagination);
    return { brands };
  }
}
