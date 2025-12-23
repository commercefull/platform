/**
 * Store Repository Interface
 * Defines the contract for store persistence operations
 */

import { Store } from '../entities/Store';

export interface StoreFilters {
  storeType?: string;
  merchantId?: string;
  businessId?: string;
  isActive?: boolean;
  isVerified?: boolean;
  isFeatured?: boolean;
}

export interface StoreRepository {
  // Store CRUD
  findById(storeId: string): Promise<Store | null>;
  findBySlug(slug: string): Promise<Store | null>;
  findByUrl(storeUrl: string): Promise<Store | null>;
  findAll(filters?: StoreFilters): Promise<Store[]>;
  save(store: Store): Promise<Store>;
  delete(storeId: string): Promise<void>;
  count(filters?: StoreFilters): Promise<number>;

  // Store queries
  findByMerchant(merchantId: string): Promise<Store[]>;
  findByBusiness(businessId: string): Promise<Store[]>;
  findActive(): Promise<Store[]>;
  findFeatured(): Promise<Store[]>;
  findByType(storeType: string): Promise<Store[]>;

  // Store statistics
  updateStats(
    storeId: string,
    stats: {
      productCount?: number;
      orderCount?: number;
      reviewCount?: number;
      followerCount?: number;
    },
  ): Promise<void>;
}
