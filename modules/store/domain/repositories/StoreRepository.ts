/**
 * Store Repository Interface
 * Defines the contract for store persistence operations
 */

import { Store } from '../entities/Store';

export interface StoreFilters {
  storeType?: string;
  organizationId?: string;
  isHeadquarters?: boolean;
  parentStoreId?: string;
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
  findByMerchant(organizationId: string): Promise<Store[]>;
  findByBusiness(organizationId: string): Promise<Store[]>;
  findHeadquarters(organizationId: string): Promise<Store | null>;
  findOutlets(parentStoreId: string): Promise<Store[]>;
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

  // Pickup and local delivery settings
  updatePickupSettings(storeId: string, pickupSettings: Record<string, unknown>): Promise<Store>;
  updateLocalDeliverySettings(storeId: string, deliverySettings: Record<string, unknown>): Promise<Store>;

  // Store hierarchy
  createHierarchy(input: {
    hierarchyId: string;
    organizationId: string;
    name: string;
    defaultStoreId: string;
    storeIds: string[];
    sharedInventoryPoolId?: string;
    sharedCatalogId?: string;
    settings?: {
      allowCrossStoreTransfers: boolean;
      allowCrossStoreFulfillment: boolean;
      centralizedPricing: boolean;
    };
  }): Promise<{
    hierarchyId: string;
    organizationId: string;
    name: string;
    defaultStoreId: string;
    createdAt: Date;
  }>;
}
