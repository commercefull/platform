import { Request, Response } from 'express';
import {
  searchProductsUseCase,
  getSearchSuggestionsUseCase,
  findSimilarProductsUseCase,
  findByAttributeUseCase
} from '../../application/useCases/attribute/SearchProducts';

export class ProductSearchController {
  /**
   * GET /products/search
   * Search products with filters and facets
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const {
        q,
        query,
        categoryId,
        categoryIds,
        brandId,
        brandIds,
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
        limit
      } = req.query;

      // Parse attribute filters from query string
      // Format: attributes[0][code]=color&attributes[0][value]=red&attributes[0][operator]=eq
      let parsedAttributes: any[] | undefined;
      if (attributes) {
        try {
          parsedAttributes = typeof attributes === 'string' 
            ? JSON.parse(attributes) 
            : attributes as any[];
        } catch {
          // If not JSON, try to parse from query params
          parsedAttributes = [];
        }
      }

      const result = await searchProductsUseCase.execute({
        query: (q || query) as string,
        categoryId: categoryId as string,
        categoryIds: categoryIds ? (categoryIds as string).split(',') : undefined,
        brandId: brandId as string,
        brandIds: brandIds ? (brandIds as string).split(',') : undefined,
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
        attributes: parsedAttributes,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Search failed: ${(error as Error).message}`
      });
    }
  }

  /**
   * POST /products/search
   * Search products with filters (POST for complex queries)
   */
  async searchPost(req: Request, res: Response): Promise<void> {
    try {
      const result = await searchProductsUseCase.execute(req.body);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Search failed: ${(error as Error).message}`
      });
    }
  }

  /**
   * GET /products/search/suggestions
   * Get search suggestions for autocomplete
   */
  async getSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { q, query, limit } = req.query;

      const result = await getSearchSuggestionsUseCase.execute({
        query: (q || query) as string,
        limit: limit ? parseInt(limit as string, 10) : 10
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to get suggestions: ${(error as Error).message}`
      });
    }
  }

  /**
   * GET /products/:productId/similar
   * Get similar products based on attributes
   */
  async findSimilar(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { limit } = req.query;

      const result = await findSimilarProductsUseCase.execute({
        productId,
        limit: limit ? parseInt(limit as string, 10) : 10
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to find similar products: ${(error as Error).message}`
      });
    }
  }

  /**
   * GET /products/by-attribute/:code/:value
   * Find products by a specific attribute value
   */
  async findByAttribute(req: Request, res: Response): Promise<void> {
    try {
      const { code, value } = req.params;

      const result = await findByAttributeUseCase.execute({
        attributeCode: code,
        value
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to find products: ${(error as Error).message}`
      });
    }
  }
}

export default new ProductSearchController();
