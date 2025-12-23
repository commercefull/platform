/**
 * CreateBrand Use Case
 */

import { Brand } from '../../domain/entities/Brand';
import { IBrandRepository } from '../../domain/repositories/BrandRepository';

export interface CreateBrandInput {
  name: string;
  slug?: string;
  description?: string;
  logoMediaId?: string;
  coverImageMediaId?: string;
  website?: string;
  countryOfOrigin?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateBrandOutput {
  brand: Brand;
}

export class CreateBrandUseCase {
  constructor(private readonly brandRepository: IBrandRepository) {}

  async execute(input: CreateBrandInput): Promise<CreateBrandOutput> {
    // Check slug uniqueness if provided
    if (input.slug) {
      const existing = await this.brandRepository.findBySlug(input.slug);
      if (existing) {
        throw new Error(`Brand with slug '${input.slug}' already exists`);
      }
    }

    const brand = Brand.create({
      name: input.name,
      slug: input.slug,
      description: input.description,
      logoMediaId: input.logoMediaId,
      coverImageMediaId: input.coverImageMediaId,
      website: input.website,
      countryOfOrigin: input.countryOfOrigin,
      isActive: input.isActive ?? true,
      isFeatured: input.isFeatured ?? false,
      sortOrder: 0,
      metadata: input.metadata,
    });

    const saved = await this.brandRepository.save(brand);
    return { brand: saved };
  }
}
