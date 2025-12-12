/**
 * Search Products Use Case
 * Searches products with full-text search and filters
 */

import { ProductRepository, ProductFilters, PaginationOptions } from '../../domain/repositories/ProductRepository';
import { Product } from '../../domain/entities/Product';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';

// ============================================================================
// Command
// ============================================================================

export class SearchProductsCommand {
  constructor(
    public readonly query: string,
    public readonly filters?: {
      categoryId?: string;
      brandId?: string;
      priceMin?: number;
      priceMax?: number;
      isFeatured?: boolean;
      tags?: string[];
    },
    public readonly limit: number = 20,
    public readonly offset: number = 0,
    public readonly orderBy: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'name' = 'relevance'
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
  basePrice: number;
  salePrice: number | null;
  effectivePrice: number;
  isOnSale: boolean;
  discountPercentage: number;
  isFeatured: boolean;
  primaryImageUrl?: string;
  categoryId?: string;
  brandId?: string;
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
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(command: SearchProductsCommand): Promise<SearchProductsResponse> {
    if (!command.query?.trim()) {
      return {
        products: [],
        total: 0,
        limit: command.limit,
        offset: command.offset,
        hasMore: false,
        query: command.query
      };
    }

    // Build filters - only show active and visible products in search
    const filters: ProductFilters = {
      status: ProductStatus.ACTIVE,
      visibility: [ProductVisibility.VISIBLE, ProductVisibility.SEARCH_ONLY, ProductVisibility.FEATURED],
      search: command.query,
      ...command.filters
    };

    // Map orderBy to pagination options
    let orderBy = 'createdAt';
    let orderDirection: 'asc' | 'desc' = 'desc';

    switch (command.orderBy) {
      case 'price_asc':
        orderBy = 'basePrice';
        orderDirection = 'asc';
        break;
      case 'price_desc':
        orderBy = 'basePrice';
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
      orderDirection
    };

    const result = await this.productRepository.search(command.query, filters, pagination);

    return {
      products: result.data.map(product => this.mapToSearchItem(product)),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
      query: command.query
    };
  }

  private mapToSearchItem(product: Product): SearchProductItemResponse {
    return {
      productId: product.productId,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      basePrice: product.price.basePrice,
      salePrice: product.price.salePrice,
      effectivePrice: product.price.effectivePrice,
      isOnSale: product.price.isOnSale,
      discountPercentage: product.price.discountPercentage,
      isFeatured: product.isFeatured,
      primaryImageUrl: product.primaryImage?.url,
      categoryId: product.categoryId,
      brandId: product.brandId,
      shortDescription: product.shortDescription
    };
  }
}
