/**
 * List Products for Context Use Case
 * Context-aware product listing that works for both marketplace and multi-store scenarios
 */

import { ProductRepository, ProductFilters } from '../../domain/repositories/ProductRepository';
import { PaginationOptions } from 'libs/types/pagination';
import { Product } from '../../domain/entities/Product';
import { OrganizationLookupPort } from '../../application/ports/OrganizationLookupPort';
import { StoreLookupPort } from '../../application/ports/StoreLookupPort';
import { ProductValidationError } from '../../domain/errors/ProductErrors';
import { SystemConfigPort } from '../../application/ports/SystemConfigPort';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
import { ProductListItemResponse, ListProductsResponse } from './ListProducts';
import type { ProductPricingPort, ProductPriceInfo } from '../ports/ProductPricingPort';
import { toProductPriceDtoOrEmpty } from '../dto/productPriceDto';
export interface ListProductsForContextCommandProps {
  context: {
    organizationId?: string;
    storeId?: string;

    // Common filters
    categoryId?: string;
    isFeatured?: boolean;
    search?: string;
    /** Price bounds in integer cents. */
    priceMinCents?: number;
    priceMaxCents?: number;
  };
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

// ============================================================================
// Command
// ============================================================================

export class ListProductsForContextCommand {
  public readonly context: {
    organizationId?: string;
    storeId?: string;

    // Common filters
    categoryId?: string;
    isFeatured?: boolean;
    search?: string;
    /** Price bounds in integer cents. */
    priceMinCents?: number;
    priceMaxCents?: number;
  };
  public readonly includeInactive: boolean;
  public readonly limit: number;
  public readonly offset: number;
  public readonly orderBy: string;
  public readonly orderDirection: 'asc' | 'desc';

  constructor(props: ListProductsForContextCommandProps) {
    this.context = props.context;
    this.includeInactive = props.includeInactive ?? false;
    this.limit = props.limit ?? 20;
    this.offset = props.offset ?? 0;
    this.orderBy = props.orderBy ?? 'createdAt';
    this.orderDirection = props.orderDirection ?? 'desc';
  }
}

// ============================================================================
// Use Case
// ============================================================================

export class ListProductsForContextUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly storeLookupPort: StoreLookupPort,
    private readonly systemConfigPort: SystemConfigPort,
    private readonly pricingPort: ProductPricingPort,
    private readonly organizationLookupPort?: OrganizationLookupPort,
  ) {}

  async execute(command: ListProductsForContextCommand): Promise<ListProductsResponse> {
    // Get system configuration to understand the operating mode
    const systemConfig = await this.systemConfigPort.findActive();

    // Build context-aware filters
    const filters = await this.buildContextFilters(command, systemConfig);

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

  private async buildContextFilters(
    command: ListProductsForContextCommand,
    systemConfig: { isMarketplace: boolean; isMultiStore: boolean; isSingleStore: boolean } | null,
  ): Promise<ProductFilters> {
    const filters: ProductFilters = {
      status: command.includeInactive ? undefined : ProductStatus.ACTIVE,
      visibility: [ProductVisibility.VISIBLE, ProductVisibility.FEATURED],
    };

    filters.organizationId = await this.resolveOrganizationId(command, systemConfig);
    this.applyContextFilters(filters, command.context);
    return filters;
  }

  /** Context-based ownership filtering. */
  private async resolveOrganizationId(
    command: ListProductsForContextCommand,
    systemConfig: { isMarketplace: boolean; isMultiStore: boolean; isSingleStore: boolean } | null,
  ): Promise<string | undefined> {
    if (systemConfig?.isMarketplace) {
      // Marketplace mode: products belong to merchants; multiple merchants may show
      return command.context.organizationId;
    }

    if (systemConfig?.isMultiStore) {
      // Multi-store mode: products belong to organizations
      if (command.context.organizationId) {
        return command.context.organizationId;
      }
      // If storeId is provided, find the organization for that store
      if (command.context.storeId) {
        const store = await this.storeLookupPort.findById(command.context.storeId);
        return store?.organizationId;
      }
      return undefined;
    }

    // Single store mode: products belong to the default organization
    if (!this.organizationLookupPort) {
      throw new ProductValidationError('Organization lookup port is required for single-store mode.');
    }
    const organizations = await this.organizationLookupPort.findAll();
    return organizations[0]?.id;
  }

  private applyContextFilters(filters: ProductFilters, context: ListProductsForContextCommand['context']): void {
    if (context.categoryId) filters.categoryId = context.categoryId;
    if (context.isFeatured !== undefined) filters.isFeatured = context.isFeatured;
    if (context.search) filters.search = context.search;
    if (context.priceMinCents !== undefined) filters.priceMinCents = context.priceMinCents;
    if (context.priceMaxCents !== undefined) filters.priceMaxCents = context.priceMaxCents;
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
      createdAt: product.createdAt.toISOString(),
    };
  }
}
