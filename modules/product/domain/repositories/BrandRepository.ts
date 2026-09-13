/**
 * Brand Repository Port
 * Domain interface for brand persistence.
 */

import { Brand, BrandStatus } from '../entities/Brand';
import { PaginatedResult, PaginationOptions } from 'libs/types/shared';

export interface BrandFilters {
  organizationId?: string;
  status?: BrandStatus | BrandStatus[];
  search?: string;
}

export interface BrandRepository {
  findById(brandId: string): Promise<Brand | null>;
  findBySlug(slug: string): Promise<Brand | null>;
  findByOrganization(organizationId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Brand>>;
  findAll(filters?: BrandFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Brand>>;
  findActive(organizationId?: string): Promise<Brand[]>;
  create(brand: Brand): Promise<Brand>;
  update(brand: Brand): Promise<Brand>;
  delete(brandId: string): Promise<void>;
  countByOrganization(organizationId: string): Promise<number>;
}
