import type { ProductSearchFilters, ProductSearchResult, AttributeFilter } from '../../services/ProductSearchService';
import type { Product } from '../../../domain/entities/Product';

export interface ProductSearchServicePort {
  search(filters: ProductSearchFilters): Promise<ProductSearchResult>;
  getSuggestions(partialQuery: string, limit?: number): Promise<string[]>;
  findByAttribute(attributeCode: string, value: string): Promise<Product[]>;
  findSimilar(productId: string, limit?: number): Promise<Product[]>;
}

export interface SearchProductsQuery {
  // Text search
  query?: string;

  // Basic filters
  categoryId?: string;
  categoryIds?: string[];
  productTypeId?: string;

  // Price filters
  minPrice?: number;
  maxPrice?: number;

  // Status filters
  status?: string;
  visibility?: string;

  // Boolean filters
  isFeatured?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  hasVariants?: boolean;
  inStock?: boolean;

  // Dynamic attribute filters
  attributes?: AttributeFilter[];

  // Sorting
  sortBy?: 'name' | 'price' | 'createdAt' | 'popularity' | 'rating' | 'relevance';
  sortOrder?: 'asc' | 'desc';

  // Pagination
  page?: number;
  limit?: number;

  // Include facets
  includeFacets?: boolean;
}

export interface SearchProductsResponse {
  success: boolean;
  data?: ProductSearchResult;
  error?: string;
}

export class SearchProductsUseCase {
  constructor(private readonly searchService: ProductSearchServicePort) {}
  async execute(query: SearchProductsQuery): Promise<SearchProductsResponse> {
    try {
      const filters: ProductSearchFilters = {
        query: query.query,
        categoryId: query.categoryId,
        categoryIds: query.categoryIds,
        productTypeId: query.productTypeId,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        status: query.status || 'active',
        visibility: query.visibility || 'visible',
        isFeatured: query.isFeatured,
        isNew: query.isNew,
        isBestseller: query.isBestseller,
        hasVariants: query.hasVariants,
        inStock: query.inStock,
        attributes: query.attributes,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        page: query.page || 1,
        limit: query.limit || 20,
      };

      const result = await this.searchService.search(filters);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: `Search failed: ${(error as Error).message}`,
      };
    }
  }
}

// ==================== Get Search Suggestions ====================

