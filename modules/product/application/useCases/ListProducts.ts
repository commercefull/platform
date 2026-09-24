/**
 * List Products Use Case
 * Lists products with filters and pagination
 */

import { ProductRepository, ProductFilters } from '../../domain/repositories/ProductRepository';
import { PaginationOptions } from 'libs/types/shared';
import { Product } from '../../domain/entities/Product';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
import type { ProductPricingPort, ProductPriceInfo } from '../ports/ProductPricingPort';
import { toProductPriceDtoOrEmpty } from '../dto/productPriceDto';

// ============================================================================
// Command
// ============================================================================

export class ListProductsCommand {
  constructor(
    public readonly filters?: {
      status?: ProductStatus | ProductStatus[];
      visibility?: ProductVisibility | ProductVisibility[];
      categoryId?: string;
      organizationId?: string;
      storeId?: string;
      isFeatured?: boolean;
      isVirtual?: boolean;
      hasVariants?: boolean;
      /** Price bounds in integer cents. */
      priceMinCents?: number;
      priceMaxCents?: number;
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
  basePriceCents: number;
  salePriceCents: number | null;
  effectivePriceCents: number;
  isOnSale: boolean;
  isFeatured: boolean;
  hasVariants: boolean;
  primaryImageUrl?: string;
  categoryId?: string;
  categorySlug?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  brandSlug?: string;
  priceFormatted?: string;
  createdAt: string;
  updatedAt?: string;
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
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly pricingPort: ProductPricingPort,
  ) {}

  async execute(command: ListProductsCommand): Promise<ListProductsResponse> {
    const filters: ProductFilters = command.filters || {};

    const pagination: PaginationOptions = {
      limit: command.limit,
      offset: command.offset,
      orderBy: command.orderBy,
      orderDirection: command.orderDirection,
    };

    const result = await this.productRepository.findAll(filters, pagination);

    // Batch-load catalog prices from the pricing-owned store
    const prices = await this.pricingPort.getBasePrices(result.data.map(p => p.productId));
    const priceByProductId = new Map<string, ProductPriceInfo>(prices.map(p => [p.productId, p]));

    return {
      products: result.data.map(product => this.mapToListItem(product, priceByProductId.get(product.productId))),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    };
  }

  private mapToListItem(product: Product, price: ProductPriceInfo | undefined): ProductListItemResponse {
    const priceDto = toProductPriceDtoOrEmpty(price);
    return {
      productId: product.productId,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      status: product.status,
      visibility: product.visibility,
      basePriceCents: priceDto.basePriceCents,
      salePriceCents: priceDto.salePriceCents,
      effectivePriceCents: priceDto.effectivePriceCents,
      isOnSale: priceDto.isOnSale,
      isFeatured: product.isFeatured,
      hasVariants: product.hasVariants,
      primaryImageUrl: product.primaryImage?.url,
      categoryId: product.categoryId,
      brandId: product.brandId,
      createdAt: product.createdAt.toISOString(),
    };
  }
}
