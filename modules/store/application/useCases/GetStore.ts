/**
 * Get Store Use Case
 * Retrieves a store by ID or slug
 */

import { StoreRepository } from '../../domain/repositories/StoreRepository';
import { Store } from '../../domain/entities/Store';

// ============================================================================
// Query
// ============================================================================

export class GetStoreQuery {
  constructor(
    public readonly storeId?: string,
    public readonly slug?: string,
    public readonly storeUrl?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface GetStoreResponse {
  store: {
    storeId: string;
    name: string;
    slug: string;
    description?: string;
    storeType: string;
    merchantId?: string;
    businessId?: string;
    storeUrl?: string;
    storeEmail?: string;
    storePhone?: string;
    logo?: string;
    banner?: string;
    primaryColor?: string;
    secondaryColor?: string;
    isActive: boolean;
    isVerified: boolean;
    isFeatured: boolean;
    storeRating?: number;
    reviewCount?: number;
    productCount?: number;
    defaultCurrency?: string;
    supportedCurrencies?: string[];
    address?: Record<string, unknown>;
    socialLinks?: Record<string, string>;
    openingHours?: Record<string, unknown>;
    settings?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  } | null;
}

// ============================================================================
// Use Case
// ============================================================================

export class GetStoreUseCase {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute(query: GetStoreQuery): Promise<GetStoreResponse> {
    if (!query.storeId && !query.slug && !query.storeUrl) {
      throw new Error('Either storeId, slug, or storeUrl must be provided');
    }

    let store: Store | null = null;

    if (query.storeId) {
      store = await this.storeRepository.findById(query.storeId);
    } else if (query.slug) {
      store = await this.storeRepository.findBySlug(query.slug);
    } else if (query.storeUrl) {
      store = await this.storeRepository.findByUrl(query.storeUrl);
    }

    if (!store) {
      return { store: null };
    }

    return {
      store: {
        storeId: store.storeId,
        name: store.name,
        slug: store.slug,
        description: store.description,
        storeType: store.storeType,
        merchantId: store.merchantId,
        businessId: store.businessId,
        storeUrl: store.storeUrl,
        storeEmail: store.storeEmail,
        storePhone: store.storePhone,
        logo: store.logo,
        banner: store.banner,
        primaryColor: store.primaryColor,
        secondaryColor: store.secondaryColor,
        isActive: store.isActive,
        isVerified: store.isVerified,
        isFeatured: store.isFeatured,
        storeRating: store.storeRating,
        reviewCount: store.reviewCount,
        productCount: store.productCount,
        defaultCurrency: store.defaultCurrency,
        supportedCurrencies: store.supportedCurrencies,
        address: store.address as Record<string, unknown>,
        socialLinks: store.socialLinks,
        openingHours: store.openingHours,
        settings: store.settings as Record<string, unknown>,
        createdAt: store.createdAt.toISOString(),
        updatedAt: store.updatedAt.toISOString(),
      },
    };
  }
}
