/**
 * Business Repository Interface
 * Defines the contract for business persistence operations
 */

import { Business } from '../entities/Business';

export interface BusinessFilters {
  businessType?: string;
  isActive?: boolean;
}

export interface BusinessRepository {
  // Business CRUD
  findById(businessId: string): Promise<Business | null>;
  findBySlug(slug: string): Promise<Business | null>;
  findByDomain(domain: string): Promise<Business | null>;
  findAll(filters?: BusinessFilters): Promise<Business[]>;
  save(business: Business): Promise<Business>;
  delete(businessId: string): Promise<void>;
  count(filters?: BusinessFilters): Promise<number>;

  // Business queries
  findActive(): Promise<Business[]>;
  findByType(businessType: string): Promise<Business[]>;
}
