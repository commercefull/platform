/**
 * Search Products Use Case
 * Searches products with full-text search and filters
 */

import { ProductRepository, ProductFilters } from '../../domain/repositories/ProductRepository';
import { PaginationOptions } from 'libs/types/shared';
import { Product } from '../../domain/entities/Product';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
import type { ProductPricingPort, ProductPriceInfo } from '../ports/ProductPricingPort';
import { toProductPriceDtoOrEmpty } from '../services/productPriceDto';

// ============================================================================
// Command
// ============================================================================

export class SearchProductsCommand {
  constructor(
    public readonly query: string,
    public readonly filters?: {
      categoryId?: string;
      /** Price bounds in integer cents. */
      priceMinCents?: number;
      priceMaxCents?: number;
      isFeatured?: boolean;
      tags?: string[];
    },
    public readonly limit: number = 20,
    public readonly offset: number = 0,
    public readonly orderBy: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'name' = 'relevance',
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface SearchProductItemResponse {
  productId: string;
  name: string;
  slug: string;
  sku?: string;
  basePriceCents: number;
  salePriceCents: number | null;
  effectivePriceCents: number;
  isOnSale: boolean;
  discountPercentage: number;
  currency: string;
  isFeatured: boolean;
  primaryImageUrl?: string;
  categoryId?: string;
  shortDescription?: string;
}

export interface SearchProductsResponse {
  products: SearchProductItemResponse[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  query: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class SearchProductsUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly pricingPort: ProductPricingPort,
  ) {}

  async execute(command: SearchProductsCommand): Promise<SearchProductsResponse> {
    if (!command.query?.trim()) {
      return {
        products: [],
        total: 0,
        limit: command.limit,
        offset: command.offset,
        hasMore: false,
        query: command.query,
      };
    }

    // Build filters - only show active and visible products in search
    const filters: ProductFilters = {
      status: ProductStatus.ACTIVE,
      visibility: [ProductVisibility.VISIBLE, ProductVisibility.SEARCH_ONLY, ProductVisibility.FEATURED],
      search: command.query,
      ...command.filters,
    };

    // Map orderBy to pagination options
    let orderBy: string;
    let orderDirection: 'asc' | 'desc';

    switch (command.orderBy) {
      case 'price_asc':
        orderBy = 'priceCents';
        orderDirection = 'asc';
        break;
      case 'price_desc':
        orderBy = 'priceCents';
        orderDirection = 'desc';
        break;
      case 'newest':
        orderBy = 'createdAt';
        orderDirection = 'desc';
        break;
      case 'name':
        orderBy = 'name';
        orderDirection = 'asc';
        break;
      case 'relevance':
      default:
        // For relevance, we'd ideally use a full-text search score
        // For now, default to newest
        orderBy = 'createdAt';
        orderDirection = 'desc';
        break;
    }

    const pagination: PaginationOptions = {
      limit: command.limit,
      offset: command.offset,
      orderBy,
      orderDirection,
    };

    const result = await this.productRepository.search(command.query, filters, pagination);

    // Batch-load catalog prices from the pricing-owned store
    const prices = await this.pricingPort.getBasePrices(result.data.map(p => p.productId));
    const priceByProductId = new Map<string, ProductPriceInfo>(prices.map(p => [p.productId, p]));

    return {
      products: result.data.map(product => this.mapToSearchItem(product, priceByProductId.get(product.productId))),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
      query: command.query,
    };
  }

  private mapToSearchItem(product: Product, price: ProductPriceInfo | undefined): SearchProductItemResponse {
    const priceDto = toProductPriceDtoOrEmpty(price);
    return {
      productId: product.productId,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      basePriceCents: priceDto.basePriceCents,
      salePriceCents: priceDto.salePriceCents,
      effectivePriceCents: priceDto.effectivePriceCents,
      isOnSale: priceDto.isOnSale,
      discountPercentage: priceDto.discountPercentage,
      currency: priceDto.currency,
      isFeatured: product.isFeatured,
      primaryImageUrl: product.primaryImage?.url,
      categoryId: product.categoryId,
      shortDescription: product.shortDescription,
    };
  }
}
