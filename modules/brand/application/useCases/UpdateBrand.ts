/**
 * UpdateBrand Use Case
 */

import { Brand } from '../../domain/entities/Brand';
import { IBrandRepository } from '../../domain/repositories/BrandRepository';

export interface UpdateBrandInput {
  brandId: string;
  name?: string;
  slug?: string;
  description?: string;
  logoMediaId?: string;
  coverImageMediaId?: string;
  website?: string;
  countryOfOrigin?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateBrandOutput {
  brand: Brand;
}

export class UpdateBrandUseCase {
  constructor(private readonly brandRepository: IBrandRepository) {}

  async execute(input: UpdateBrandInput): Promise<UpdateBrandOutput> {
    const brand = await this.brandRepository.findById(input.brandId);
    if (!brand) {
      throw new Error(`Brand not found: ${input.brandId}`);
    }

    // Check slug uniqueness if being updated
    if (input.slug && input.slug !== brand.slug) {
      const existing = await this.brandRepository.findBySlug(input.slug);
      if (existing) {
        throw new Error(`Brand with slug '${input.slug}' already exists`);
      }
    }

    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.slug !== undefined) updates.slug = input.slug;
    if (input.description !== undefined) updates.description = input.description;
    if (input.logoMediaId !== undefined) updates.logoMediaId = input.logoMediaId;
    if (input.coverImageMediaId !== undefined) updates.coverImageMediaId = input.coverImageMediaId;
    if (input.website !== undefined) updates.website = input.website;
    if (input.countryOfOrigin !== undefined) updates.countryOfOrigin = input.countryOfOrigin;
    if (input.isActive !== undefined) updates.isActive = input.isActive;
    if (input.isFeatured !== undefined) updates.isFeatured = input.isFeatured;
    if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;
    if (input.metadata !== undefined) updates.metadata = input.metadata;

    brand.update(updates);
    const saved = await this.brandRepository.save(brand);
    return { brand: saved };
  }
}
