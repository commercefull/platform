import { Brand } from '../../domain/entities/Brand';
import type { BrandFilters, BrandRepository } from '../../domain/repositories/BrandRepository';
import type { PaginatedResult, PaginationOptions } from 'libs/types/shared';

export class ManageBrandsUseCase {
  constructor(private readonly brands: BrandRepository) {}

  async findById(brandId: string): Promise<Brand | null> {
    return this.brands.findById(brandId);
  }
  async findBySlug(slug: string): Promise<Brand | null> {
    return this.brands.findBySlug(slug);
  }
  async findByOrganization(organizationId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Brand>> {
    return this.brands.findByOrganization(organizationId, pagination);
  }
  async findAll(filters?: BrandFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Brand>> {
    return this.brands.findAll(filters, pagination);
  }
  async findActive(organizationId?: string): Promise<Brand[]> {
    return this.brands.findActive(organizationId);
  }
  async create(props: {
    organizationId: string;
    name: string;
    slug?: string;
    description?: string;
    logoUrl?: string;
    website?: string;
    countryOfOrigin?: string;
  }): Promise<Brand> {
    return this.brands.create(
      Brand.create({
        organizationId: props.organizationId,
        name: props.name,
        slug: props.slug,
        description: props.description,
        logoUrl: props.logoUrl,
        website: props.website,
        countryOfOrigin: props.countryOfOrigin,
      }),
    );
  }

  /**
   * Load a brand, apply profile changes and an optional status transition,
   * then persist. Returns null when the brand does not exist.
   */
  async updateDetails(
    brandId: string,
    updates: {
      name?: string;
      description?: string;
      logoUrl?: string;
      website?: string;
      countryOfOrigin?: string;
    },
    status?: 'active' | 'inactive' | 'archived',
  ): Promise<Brand | null> {
    const brand = await this.brands.findById(brandId);
    if (!brand) return null;

    brand.updateProfile({
      name: updates.name,
      description: updates.description,
      logoUrl: updates.logoUrl,
      website: updates.website,
      countryOfOrigin: updates.countryOfOrigin,
    });

    if (status === 'active') {
      brand.activate();
    } else if (status === 'inactive') {
      brand.deactivate();
    } else if (status === 'archived') {
      brand.archive();
    }

    return this.brands.update(brand);
  }
  async update(brand: Brand): Promise<Brand> {
    return this.brands.update(brand);
  }
  async delete(brandId: string): Promise<void> {
    return this.brands.delete(brandId);
  }
  async countByOrganization(organizationId: string): Promise<number> {
    return this.brands.countByOrganization(organizationId);
  }
}
