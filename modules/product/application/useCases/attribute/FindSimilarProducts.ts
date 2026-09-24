import type { ProductSearchServicePort } from './SearchProducts';

export interface FindSimilarProductsQuery {
  productId: string;
  limit?: number;
}

export interface FindSimilarProductsResponse {
  success: boolean;
  data?: unknown[];
  error?: string;
}

export class FindSimilarProductsUseCase {
  constructor(private readonly searchService: ProductSearchServicePort) {}
  async execute(query: FindSimilarProductsQuery): Promise<FindSimilarProductsResponse> {
    try {
      const products = await this.searchService.findSimilar(query.productId, query.limit || 10);

      return {
        success: true,
        data: products,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to find similar products: ${(error as Error).message}`,
      };
    }
  }
}

// ==================== Find Products by Attribute ====================

