import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import {
  attributeSearchProductsUseCase as searchProductsUseCase,
  getSearchSuggestionsUseCase,
  findSimilarProductsUseCase,
  findByAttributeUseCase,
} from '../../application/useCases/wired';
import type { SearchProductsQuery } from '../../application/useCases/attribute/SearchProducts';
import type { AttributeFilter } from '../../application/ports/ProductSearchPort';

type QueryBag = Record<string, unknown>;

const optBool = (value: unknown): boolean | undefined => (value === 'true' ? true : value === 'false' ? false : undefined);
const optInt = (value: unknown): number | undefined => (value ? parseInt(value as string, 10) : undefined);

/** Parse attribute filters from query string. Format: attributes[0][code]=color&attributes[0][value]=red&attributes[0][operator]=eq */
function parseAttributes(attributes: unknown): unknown[] | undefined {
  if (!attributes) return undefined;
  try {
    return typeof attributes === 'string' ? JSON.parse(attributes) : (attributes as unknown[]);
  } catch {
    // If not JSON, try to parse from query params
    return [];
  }
}

function buildSearchQuery(query: QueryBag): SearchProductsQuery {
  const q = query as QueryBag & { [k: string]: unknown };
  return {
    query: (q.q || q.query) as string,
    categoryId: q.categoryId as string,
    categoryIds: q.categoryIds ? (q.categoryIds as string).split(',') : undefined,
    productTypeId: q.productTypeId as string,
    minPriceCents: optInt(q.minPriceCents),
    maxPriceCents: optInt(q.maxPriceCents),
    status: q.status as string,
    visibility: q.visibility as string,
    isFeatured: optBool(q.isFeatured),
    isNew: optBool(q.isNew),
    isBestseller: optBool(q.isBestseller),
    hasVariants: optBool(q.hasVariants),
    inStock: optBool(q.inStock),
    attributes: parseAttributes(q.attributes) as AttributeFilter[] | undefined,
    sortBy: q.sortBy as SearchProductsQuery['sortBy'],
    sortOrder: q.sortOrder as SearchProductsQuery['sortOrder'],
    page: optInt(q.page) ?? 1,
    limit: optInt(q.limit) ?? 20,
  } as SearchProductsQuery;
}

class ProductSearchController {
  /**
   * GET /products/search
   * Search products with filters and facets
   */
  search = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const result = await searchProductsUseCase.execute(buildSearchQuery(req.query));

    if (!result.success) {
      jsonResponse(res, 400, result);
      return;
    }

    jsonResponse(res, 200, result);
  };

  /**
   * POST /products/search
   * Search products with filters (POST for complex queries)
   */
  searchPost = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const result = await searchProductsUseCase.execute(req.body as SearchProductsQuery);

    if (!result.success) {
      jsonResponse(res, 400, result);
      return;
    }

    jsonResponse(res, 200, result);
  };

  /**
   * GET /products/search/suggestions
   * Get search suggestions for autocomplete
   */
  getSuggestions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { q, query, limit } = req.query;

    const result = await getSearchSuggestionsUseCase.execute({
      query: (q || query) as string,
      limit: limit ? parseInt(limit as string, 10) : 10,
    });

    if (!result.success) {
      jsonResponse(res, 400, result);
      return;
    }

    jsonResponse(res, 200, result);
  };

  /**
   * GET /products/:productId/similar
   * Get similar products based on attributes
   */
  findSimilar = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { productId } = req.params;
    const { limit } = req.query;

    const result = await findSimilarProductsUseCase.execute({
      productId,
      limit: limit ? parseInt(limit as string, 10) : 10,
    });

    if (!result.success) {
      jsonResponse(res, 400, result);
      return;
    }

    jsonResponse(res, 200, result);
  };

  /**
   * GET /products/by-attribute/:code/:value
   * Find products by a specific attribute value
   */
  findByAttribute = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { code, value } = req.params;

    const result = await findByAttributeUseCase.execute({
      attributeCode: code,
      value,
    });

    if (!result.success) {
      jsonResponse(res, 400, result);
      return;
    }

    jsonResponse(res, 200, result);
  };
}

export default new ProductSearchController();
