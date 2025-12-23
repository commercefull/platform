/**
 * List Stores Use Case
 * Lists stores with optional filtering and pagination
 */

import { StoreRepository } from '../../domain/repositories/StoreRepository';

// ============================================================================
// Query
// ============================================================================

export class ListStoresQuery {
  constructor(
    public readonly filters?: {
      storeType?: 'merchant_store' | 'business_store';
      merchantId?: string;
      businessId?: string;
      isActive?: boolean;
      isVerified?: boolean;
      isFeatured?: boolean;
      search?: string;
    },
    public readonly pagination?: {
      page?: number;
      limit?: number;
    },
    public readonly sort?: {
      field: string;
      direction: 'asc' | 'desc';
    }
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface ListStoresResponse {
  stores: Array<{
    storeId: string;
    name: string;
    slug: string;
    storeType: string;
    merchantId?: string;
    businessId?: string;
    storeUrl?: string;
    logo?: string;
    isActive: boolean;
    isVerified: boolean;
    isFeatured: boolean;
    storeRating?: number;
    productCount?: number;
    createdAt: string;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Use Case
// ============================================================================

export class ListStoresUseCase {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute(query: ListStoresQuery): Promise<ListStoresResponse> {
    const page = query.pagination?.page || 1;
    const limit = query.pagination?.limit || 20;

    // Build filters from query
    const filters = {
      storeType: query.filters?.storeType,
      merchantId: query.filters?.merchantId,
      businessId: query.filters?.businessId,
      isActive: query.filters?.isActive,
      isVerified: query.filters?.isVerified,
      isFeatured: query.filters?.isFeatured,
    };

    // Get all stores matching filters
    const allStores = await this.storeRepository.findAll(filters);
    const total = await this.storeRepository.count(filters);

    // Apply pagination in-memory (repository should be enhanced for DB-level pagination)
    const offset = (page - 1) * limit;
    const paginatedStores = allStores.slice(offset, offset + limit);

    const stores = paginatedStores.map(store => ({
      storeId: store.storeId,
      name: store.name,
      slug: store.slug,
      storeType: store.storeType,
      merchantId: store.merchantId,
      businessId: store.businessId,
      storeUrl: store.storeUrl,
      logo: store.logo,
      isActive: store.isActive,
      isVerified: store.isVerified,
      isFeatured: store.isFeatured,
      storeRating: store.storeRating,
      productCount: store.productCount,
      createdAt: store.createdAt.toISOString(),
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      stores,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
