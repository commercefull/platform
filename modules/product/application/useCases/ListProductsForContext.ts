/**
 * List Products for Context Use Case
 * Context-aware product listing that works for both marketplace and multi-store scenarios
 */

import { ProductRepository, PaginationOptions } from '../../domain/repositories/ProductRepository';
import { BusinessRepository } from '../../../business/domain/repositories/BusinessRepository';
import { StoreRepository } from '../../../store/domain/repositories/StoreRepository';
import { SystemConfigurationRepository } from '../../../configuration/domain/repositories/SystemConfigurationRepository';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
import { ProductListItemResponse, ListProductsResponse } from './ListProducts';

// ============================================================================
// Command
// ============================================================================

export class ListProductsForContextCommand {
  constructor(
    public readonly context: {
      // Marketplace context
      merchantId?: string;

      // Multi-store context
      businessId?: string;
      storeId?: string;

      // Common filters
      categoryId?: string;
      brandId?: string;
      isFeatured?: boolean;
      search?: string;
      priceMin?: number;
      priceMax?: number;
    },
    public readonly includeInactive: boolean = false,
    public readonly limit: number = 20,
    public readonly offset: number = 0,
    public readonly orderBy: string = 'createdAt',
    public readonly orderDirection: 'asc' | 'desc' = 'desc'
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class ListProductsForContextUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly storeRepository: StoreRepository,
    private readonly systemConfigRepository: SystemConfigurationRepository
  ) {}

  async execute(command: ListProductsForContextCommand): Promise<ListProductsResponse> {
    // Get system configuration to understand the operating mode
    const systemConfig = await this.systemConfigRepository.findActive();

    // Build context-aware filters
    const filters = await this.buildContextFilters(command, systemConfig);

    const pagination: PaginationOptions = {
      limit: command.limit,
      offset: command.offset,
      orderBy: command.orderBy,
      orderDirection: command.orderDirection
    };

    const result = await this.productRepository.findAll(filters, pagination);

    return {
      products: result.data.map(product => this.mapToListItem(product)),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore
    };
  }

  private async buildContextFilters(command: ListProductsForContextCommand, systemConfig: any) {
    const filters: any = {
      status: command.includeInactive ? undefined : ProductStatus.ACTIVE,
      visibility: [ProductVisibility.VISIBLE, ProductVisibility.FEATURED]
    };

    // Apply context-based ownership filtering
    if (systemConfig.isMarketplace) {
      // Marketplace mode: products belong to merchants
      if (command.context.merchantId) {
        filters.merchantId = command.context.merchantId;
      }
      // In marketplace, we might show products from multiple merchants
    } else if (systemConfig.isMultiStore) {
      // Multi-store mode: products belong to businesses
      if (command.context.businessId) {
        filters.businessId = command.context.businessId;
      } else if (command.context.storeId) {
        // If storeId is provided, find the business for that store
        const store = await this.storeRepository.findById(command.context.storeId);
        if (store?.businessId) {
          filters.businessId = store.businessId;
        }
      }
    } else {
      // Single store mode: products belong to the default business
      const defaultBusiness = await this.businessRepository.findActive().then(businesses => businesses[0]);
      if (defaultBusiness) {
        filters.businessId = defaultBusiness.businessId;
      }
    }

    // Apply common filters
    if (command.context.categoryId) filters.categoryId = command.context.categoryId;
    if (command.context.brandId) filters.brandId = command.context.brandId;
    if (command.context.isFeatured !== undefined) filters.isFeatured = command.context.isFeatured;
    if (command.context.search) filters.search = command.context.search;
    if (command.context.priceMin !== undefined) filters.priceMin = command.context.priceMin;
    if (command.context.priceMax !== undefined) filters.priceMax = command.context.priceMax;

    return filters;
  }

  private mapToListItem(product: any): ProductListItemResponse {
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
      createdAt: product.createdAt.toISOString()
    };
  }
}
