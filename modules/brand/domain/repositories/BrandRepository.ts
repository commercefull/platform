/**
 * Brand Repository Interface
 */

import { Brand } from '../entities/Brand';

export interface BrandFilters {
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IBrandRepository {
  save(brand: Brand): Promise<Brand>;
  findById(brandId: string): Promise<Brand | null>;
  findBySlug(slug: string): Promise<Brand | null>;
  findAll(filters?: BrandFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Brand>>;
  findFeatured(): Promise<Brand[]>;
  delete(brandId: string): Promise<boolean>;
  count(filters?: BrandFilters): Promise<number>;
}
