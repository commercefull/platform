import { GetProductCommand } from '../../application/useCases/GetProduct';
import { ListProductsCommand } from '../../application/useCases/ListProducts';
import { SearchProductsCommand } from '../../application/useCases/SearchProducts';
import { getProductUseCase, listProductsUseCase, searchProductsUseCase } from '../../application/useCases/wired';

export const productResolvers = {
  Query: {
    product: async (_parent: unknown, args: {
      productId?: string;
      slug?: string;
      sku?: string;
      includeVariants?: boolean;
      includeImages?: boolean;
    }) => {
      const useCase = getProductUseCase;
      const command = new GetProductCommand(
        args.productId,
        args.slug,
        args.sku,
        args.includeVariants ?? true,
        args.includeImages ?? true,
      );
      return useCase.execute(command);
    },

    products: async (_parent: unknown, args: {
      filters?: Record<string, unknown>;
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
    }) => {
      const useCase = listProductsUseCase;
      const command = new ListProductsCommand(
        args.filters,
        args.limit ?? 20,
        args.offset ?? 0,
        args.orderBy ?? 'createdAt',
        args.orderDirection ?? 'desc',
      );
      return useCase.execute(command);
    },

    searchProducts: async (_parent: unknown, args: {
      query: string;
      filters?: Record<string, unknown>;
      limit?: number;
      offset?: number;
      orderBy?: string;
    }) => {
      const useCase = searchProductsUseCase;
      const command = new SearchProductsCommand(
        args.query,
        args.filters,
        args.limit ?? 20,
        args.offset ?? 0,
        (args.orderBy as 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'name') ?? 'relevance',
      );
      return useCase.execute(command);
    },
  },
};
