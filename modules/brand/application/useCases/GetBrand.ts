/**
 * GetBrand Use Case
 */

import { Brand } from '../../domain/entities/Brand';
import { IBrandRepository } from '../../domain/repositories/BrandRepository';

export interface GetBrandInput {
  brandId?: string;
  slug?: string;
}

export interface GetBrandOutput {
  brand: Brand | null;
}

export class GetBrandUseCase {
  constructor(private readonly brandRepository: IBrandRepository) {}

  async execute(input: GetBrandInput): Promise<GetBrandOutput> {
    if (!input.brandId && !input.slug) {
      throw new Error('Either brandId or slug must be provided');
    }

    let brand: Brand | null = null;
    if (input.brandId) {
      brand = await this.brandRepository.findById(input.brandId);
    } else if (input.slug) {
      brand = await this.brandRepository.findBySlug(input.slug);
    }

    return { brand };
  }
}
