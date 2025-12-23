/**
 * List Products Use Case
 * Lists products with filters and pagination
 */

import { ProductRepository, ProductFilters, PaginationOptions } from '../../domain/repositories/ProductRepository';
import { Product } from '../../domain/entities/Product';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';

// ============================================================================
// Command
// ============================================================================

export class ListProductsCommand {
  constructor(
    public readonly filters?: {
      status?: ProductStatus | ProductStatus[];
      visibility?: ProductVisibility | ProductVisibility[];
      categoryId?: string;
      brandId?: string;
      merchantId?: string;
      businessId?: string;
      storeId?: string;
      isFeatured?: boolean;
      isVirtual?: boolean;
      hasVariants?: boolean;
      priceMin?: number;
      priceMax?: number;
      tags?: string[];
      search?: string;
    },
    public readonly limit: number = 20,
    public readonly offset: number = 0,
    public readonly orderBy: string = 'createdAt',
    public readonly orderDirection: 'asc' | 'desc' = 'desc',
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface ProductListItemResponse {
  productId: string;
  name: string;
  slug: string;
  sku?: string;
  status: string;
  visibility: string;
  basePrice: number;
  salePrice: number | null;
  effectivePrice: number;
  isOnSale: boolean;
  isFeatured: boolean;
  hasVariants: boolean;
  primaryImageUrl?: string;
  categoryId?: string;
  createdAt: string;
}

export interface ListProductsResponse {
  products: ProductListItemResponse[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================================================
// Use Case
// ============================================================================

export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(command: ListProductsCommand): Promise<ListProductsResponse> {
    const filters: ProductFilters = command.filters || {};

    const pagination: PaginationOptions = {
      limit: command.limit,
      offset: command.offset,
      orderBy: command.orderBy,
      orderDirection: command.orderDirection,
    };

    const result = await this.productRepository.findAll(filters, pagination);

    return {
      products: result.data.map(product => this.mapToListItem(product)),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    };
  }

  private mapToListItem(product: Product): ProductListItemResponse {
    return {
      productId: product.productId,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      status: product.status,
      visibility: product.visibility,
      basePrice: product.price.basePrice,
      salePrice: product.price.salePrice,
      effectivePrice: product.price.effectivePrice,
      isOnSale: product.price.isOnSale,
      isFeatured: product.isFeatured,
      hasVariants: product.hasVariants,
      primaryImageUrl: product.primaryImage?.url,
      categoryId: product.categoryId,
      createdAt: product.createdAt.toISOString(),
    };
  }
}
