import productSearchService, { 
  ProductSearchFilters, 
  ProductSearchResult,
  AttributeFilter 
} from '../../services/ProductSearchService';

export interface SearchProductsQuery {
  // Text search
  query?: string;
  
  // Basic filters
  categoryId?: string;
  categoryIds?: string[];
  brandId?: string;
  brandIds?: string[];
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
  async execute(query: SearchProductsQuery): Promise<SearchProductsResponse> {
    try {
      const filters: ProductSearchFilters = {
        query: query.query,
        categoryId: query.categoryId,
        categoryIds: query.categoryIds,
        brandId: query.brandId,
        brandIds: query.brandIds,
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
        limit: query.limit || 20
      };

      const result = await productSearchService.search(filters);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: `Search failed: ${(error as Error).message}`
      };
    }
  }
}

// ==================== Get Search Suggestions ====================

export interface GetSearchSuggestionsQuery {
  query: string;
  limit?: number;
}

export interface GetSearchSuggestionsResponse {
  success: boolean;
  data?: string[];
  error?: string;
}

export class GetSearchSuggestionsUseCase {
  async execute(query: GetSearchSuggestionsQuery): Promise<GetSearchSuggestionsResponse> {
    try {
      if (!query.query || query.query.length < 2) {
        return {
          success: true,
          data: []
        };
      }

      const suggestions = await productSearchService.getSuggestions(
        query.query, 
        query.limit || 10
      );

      return {
        success: true,
        data: suggestions
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get suggestions: ${(error as Error).message}`
      };
    }
  }
}

// ==================== Find Similar Products ====================

export interface FindSimilarProductsQuery {
  productId: string;
  limit?: number;
}

export interface FindSimilarProductsResponse {
  success: boolean;
  data?: any[];
  error?: string;
}

export class FindSimilarProductsUseCase {
  async execute(query: FindSimilarProductsQuery): Promise<FindSimilarProductsResponse> {
    try {
      const products = await productSearchService.findSimilar(
        query.productId,
        query.limit || 10
      );

      return {
        success: true,
        data: products
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to find similar products: ${(error as Error).message}`
      };
    }
  }
}

// ==================== Find Products by Attribute ====================

export interface FindByAttributeQuery {
  attributeCode: string;
  value: string;
}

export interface FindByAttributeResponse {
  success: boolean;
  data?: any[];
  error?: string;
}

export class FindByAttributeUseCase {
  async execute(query: FindByAttributeQuery): Promise<FindByAttributeResponse> {
    try {
      const products = await productSearchService.findByAttribute(
        query.attributeCode,
        query.value
      );

      return {
        success: true,
        data: products
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to find products by attribute: ${(error as Error).message}`
      };
    }
  }
}

export const searchProductsUseCase = new SearchProductsUseCase();
export const getSearchSuggestionsUseCase = new GetSearchSuggestionsUseCase();
export const findSimilarProductsUseCase = new FindSimilarProductsUseCase();
export const findByAttributeUseCase = new FindByAttributeUseCase();
