/**
 * Product Customer Controller
 * HTTP interface for customer-facing product operations
 */

import { logger } from '../../../../libs/logger';
import { Request, Response } from 'express';
import ProductRepo from '../../infrastructure/repositories/ProductRepository';
import { GetProductCommand, GetProductUseCase } from '../../application/useCases/GetProduct';
import { ListProductsCommand, ListProductsUseCase } from '../../application/useCases/ListProducts';
import { SearchProductsCommand, SearchProductsUseCase } from '../../application/useCases/SearchProducts';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';

// ============================================================================
// Content Negotiation Helpers
// ============================================================================

function respond(req: Request, res: Response, data: any, statusCode: number = 200, htmlTemplate?: string): void {
  const acceptHeader = req.get('Accept') || 'application/json';
  if (acceptHeader.includes('text/html') && htmlTemplate) {
    res.status(statusCode).render(htmlTemplate, { data, success: true });
  } else {
    res.status(statusCode).json({ success: true, data });
  }
}

function respondError(req: Request, res: Response, message: string, statusCode: number = 500, htmlTemplate?: string): void {
  const acceptHeader = req.get('Accept') || 'application/json';
  if (acceptHeader.includes('text/html') && htmlTemplate) {
    res.status(statusCode).render(htmlTemplate, { error: message, success: false });
  } else {
    res.status(statusCode).json({ success: false, error: message });
  }
}

// ============================================================================
// Controller Actions
// ============================================================================

/**
 * List products (storefront)
 * GET /products
 */
export const listProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId, brandId, priceMin, priceMax, isFeatured, tags, limit, offset, orderBy, orderDirection } = req.query;

    const filters: any = {
      status: ProductStatus.ACTIVE,
      visibility: [ProductVisibility.VISIBLE, ProductVisibility.FEATURED],
    };
    if (categoryId) filters.categoryId = categoryId as string;
    if (brandId) filters.brandId = brandId as string;
    if (priceMin) filters.priceMin = parseFloat(priceMin as string);
    if (priceMax) filters.priceMax = parseFloat(priceMax as string);
    if (isFeatured === 'true') filters.isFeatured = true;
    if (tags) filters.tags = (tags as string).split(',');

    const command = new ListProductsCommand(
      filters,
      parseInt(limit as string) || 20,
      parseInt(offset as string) || 0,
      (orderBy as string) || 'createdAt',
      (orderDirection as 'asc' | 'desc') || 'desc',
    );

    const useCase = new ListProductsUseCase(ProductRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 200, 'product/list');
  } catch (error: any) {
    logger.error('Error:', error);

    respondError(req, res, error.message || 'Failed to list products', 500, 'product/error');
  }
};

/**
 * Get product by ID or slug
 * GET /products/:identifier
 */
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier } = req.params;

    // Determine if identifier is UUID or slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    const command = new GetProductCommand(isUuid ? identifier : undefined, isUuid ? undefined : identifier, undefined, true, true);

    const useCase = new GetProductUseCase(ProductRepo);
    const product = await useCase.execute(command);

    if (!product) {
      respondError(req, res, 'Product not found', 404, 'product/error');
      return;
    }

    // Only show active and visible products to customers
    if (product.status !== 'active' || !['visible', 'featured'].includes(product.visibility)) {
      respondError(req, res, 'Product not found', 404, 'product/error');
      return;
    }

    respond(req, res, product, 200, 'product/detail');
  } catch (error: any) {
    logger.error('Error:', error);

    respondError(req, res, error.message || 'Failed to get product', 500, 'product/error');
  }
};

/**
 * Search products
 * GET /products/search
 */
export const searchProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, categoryId, brandId, priceMin, priceMax, limit, offset, orderBy } = req.query;

    if (!q) {
      respond(req, res, { products: [], total: 0, query: '' }, 200, 'product/search');
      return;
    }

    const filters: any = {};
    if (categoryId) filters.categoryId = categoryId as string;
    if (brandId) filters.brandId = brandId as string;
    if (priceMin) filters.priceMin = parseFloat(priceMin as string);
    if (priceMax) filters.priceMax = parseFloat(priceMax as string);

    const command = new SearchProductsCommand(
      q as string,
      filters,
      parseInt(limit as string) || 20,
      parseInt(offset as string) || 0,
      (orderBy as any) || 'relevance',
    );

    const useCase = new SearchProductsUseCase(ProductRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 200, 'product/search');
  } catch (error: any) {
    logger.error('Error:', error);

    respondError(req, res, error.message || 'Failed to search products', 500, 'product/error');
  }
};

/**
 * Get featured products
 * GET /products/featured
 */
export const getFeaturedProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit, offset } = req.query;

    const command = new ListProductsCommand(
      {
        status: ProductStatus.ACTIVE,
        visibility: [ProductVisibility.VISIBLE, ProductVisibility.FEATURED],
        isFeatured: true,
      },
      parseInt(limit as string) || 10,
      parseInt(offset as string) || 0,
      'createdAt',
      'desc',
    );

    const useCase = new ListProductsUseCase(ProductRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 200, 'product/featured');
  } catch (error: any) {
    logger.error('Error:', error);

    respondError(req, res, error.message || 'Failed to get featured products', 500, 'product/error');
  }
};

/**
 * Get products by category
 * GET /products/category/:categoryId
 */
export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { limit, offset, orderBy, orderDirection } = req.query;

    const command = new ListProductsCommand(
      {
        categoryId,
        status: ProductStatus.ACTIVE,
        visibility: [ProductVisibility.VISIBLE, ProductVisibility.FEATURED],
      },
      parseInt(limit as string) || 20,
      parseInt(offset as string) || 0,
      (orderBy as string) || 'createdAt',
      (orderDirection as 'asc' | 'desc') || 'desc',
    );

    const useCase = new ListProductsUseCase(ProductRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 200, 'product/category');
  } catch (error: any) {
    logger.error('Error:', error);

    respondError(req, res, error.message || 'Failed to get products', 500, 'product/error');
  }
};

/**
 * Get related products
 * GET /products/:productId/related
 */
export const getRelatedProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { limit } = req.query;

    const products = await ProductRepo.findRelated(productId, parseInt(limit as string) || 8);

    respond(req, res, { products }, 200, 'product/related');
  } catch (error: any) {
    logger.error('Error:', error);

    respondError(req, res, error.message || 'Failed to get related products', 500, 'product/error');
  }
};
