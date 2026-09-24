import type { ProductSearchServicePort } from './SearchProducts';

export interface FindByAttributeQuery {
  attributeCode: string;
  value: string;
}

export interface FindByAttributeResponse {
  success: boolean;
  data?: unknown[];
  error?: string;
}

export class FindByAttributeUseCase {
  constructor(private readonly searchService: ProductSearchServicePort) {}
  async execute(query: FindByAttributeQuery): Promise<FindByAttributeResponse> {
    try {
      const products = await this.searchService.findByAttribute(query.attributeCode, query.value);

      return {
        success: true,
        data: products,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to find products by attribute: ${(error as Error).message}`,
      };
    }
  }
}
