import type { ProductSearchServicePort } from './SearchProducts';

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
  constructor(private readonly searchService: ProductSearchServicePort) {}
  async execute(query: GetSearchSuggestionsQuery): Promise<GetSearchSuggestionsResponse> {
    try {
      if (!query.query || query.query.length < 2) {
        return {
          success: true,
          data: [],
        };
      }

      const suggestions = await this.searchService.getSuggestions(query.query, query.limit || 10);

      return {
        success: true,
        data: suggestions,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get suggestions: ${(error as Error).message}`,
      };
    }
  }
}

// ==================== Find Similar Products ====================

