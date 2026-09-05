import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import {
  searchProductsUseCase,
  getSearchSuggestionsUseCase,
  findSimilarProductsUseCase,
  findByAttributeUseCase,
} from '../../application/useCases/attribute/SearchProducts';
import type { SearchProductsQuery } from '../../application/useCases/attribute/SearchProducts';
import type { AttributeFilter } from '../../application/services/ProductSearchService';

class ProductSearchController {
  /**
   * GET /products/search
   * Search products with filters and facets
   */
  async search(req: TypedRequest, res: Response): Promise<void> {
    const {
      q,
      query,
      categoryId,
      categoryIds,
      productTypeId,
      minPrice,
      maxPrice,
      status,
      visibility,
      isFeatured,
      isNew,
      isBestseller,
      hasVariants,
      inStock,
      attributes,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.query;

    // Parse attribute filters from query string
    // Format: attributes[0][code]=color&attributes[0][value]=red&attributes[0][operator]=eq
    let parsedAttributes: unknown[] | undefined;
    if (attributes) {
      try {
        parsedAttributes = typeof attributes === 'string' ? JSON.parse(attributes) : (attributes as unknown[]);
      } catch {
        // If not JSON, try to parse from query params
        parsedAttributes = [];
      }
    }

    const result = await searchProductsUseCase.execute({
      query: (q || query) as string,
      categoryId: categoryId as string,
      categoryIds: categoryIds ? (categoryIds as string).split(',') : undefined,
      productTypeId: productTypeId as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      status: status as string,
      visibility: visibility as string,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      isNew: isNew === 'true' ? true : isNew === 'false' ? false : undefined,
      isBestseller: isBestseller === 'true' ? true : isBestseller === 'false' ? false : undefined,
      hasVariants: hasVariants === 'true' ? true : hasVariants === 'false' ? false : undefined,
      inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
      attributes: parsedAttributes as AttributeFilter[] | undefined,
      sortBy: sortBy as SearchProductsQuery['sortBy'],
      sortOrder: sortOrder as SearchProductsQuery['sortOrder'],
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
    
  }

  /**
   * POST /products/search
   * Search products with filters (POST for complex queries)
   */
  async searchPost(req: TypedRequest, res: Response): Promise<void> {
    const result = await searchProductsUseCase.execute(req.body as SearchProductsQuery);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
    
  }

  /**
   * GET /products/search/suggestions
   * Get search suggestions for autocomplete
   */
  async getSuggestions(req: TypedRequest, res: Response): Promise<void> {
    const { q, query, limit } = req.query;

    const result = await getSearchSuggestionsUseCase.execute({
      query: (q || query) as string,
      limit: limit ? parseInt(limit as string, 10) : 10,
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
    
  }

  /**
   * GET /products/:productId/similar
   * Get similar products based on attributes
   */
  async findSimilar(req: TypedRequest, res: Response): Promise<void> {
    const { productId } = req.params;
    const { limit } = req.query;

    const result = await findSimilarProductsUseCase.execute({
      productId,
      limit: limit ? parseInt(limit as string, 10) : 10,
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
    
  }

  /**
   * GET /products/by-attribute/:code/:value
   * Find products by a specific attribute value
   */
  async findByAttribute(req: TypedRequest, res: Response): Promise<void> {
    const { code, value } = req.params;

    const result = await findByAttributeUseCase.execute({
      attributeCode: code,
      value,
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
    
  }
}

export default new ProductSearchController();
