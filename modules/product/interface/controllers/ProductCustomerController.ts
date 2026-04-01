/**
 * Product Customer Controller
 * HTTP interface for customer-facing product operations
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import ProductRepo from '../../infrastructure/repositories/ProductRepository';
import { GetProductCommand, GetProductUseCase } from '../../application/useCases/GetProduct';
import { ListProductsCommand, ListProductsUseCase } from '../../application/useCases/ListProducts';
import { SearchProductsCommand, SearchProductsUseCase } from '../../application/useCases/SearchProducts';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
import productReviewRepo from '../../infrastructure/repositories/productReviewRepo';
import productQaRepo from '../../infrastructure/repositories/productQaRepo';
import { SubmitProductQaCommand, SubmitProductQaUseCase } from '../../application/useCases/SubmitProductQa';
import { VoteOnReviewCommand, VoteOnReviewUseCase } from '../../application/useCases/VoteOnReview';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';

// ============================================================================
// Content Negotiation Helpers
// ============================================================================

function respond(req: TypedRequest, res: Response, data: any, statusCode: number = 200, htmlTemplate?: string): void {
  const acceptHeader = req.get('Accept') || 'application/json';
  if (acceptHeader.includes('text/html') && htmlTemplate) {
    res.status(statusCode).render(htmlTemplate, { data, success: true });
  } else {
    res.status(statusCode).json({ success: true, data });
  }
}

function respondError(req: TypedRequest, res: Response, message: string, statusCode: number = 500, htmlTemplate?: string): void {
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
export const listProducts = async (req: TypedRequest, res: Response): Promise<void> => {
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
export const getProduct = async (req: TypedRequest, res: Response): Promise<void> => {
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
export const searchProducts = async (req: TypedRequest, res: Response): Promise<void> => {
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
 * Get product by variant barcode
 * GET /products/barcode/:barcode
 */
export const findByBarcode = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { barcode } = req.params;

    if (!barcode?.trim()) {
      respondError(req, res, 'Barcode is required', 400);
      return;
    }

    const result = await ProductRepo.findByBarcode(barcode);
    if (!result) {
      respondError(req, res, 'Product not found', 404, 'product/error');
      return;
    }

    // Only expose active and visible products to customers
    if (result.product.status !== 'active' || !['visible', 'featured'].includes(result.product.visibility)) {
      respondError(req, res, 'Product not found', 404, 'product/error');
      return;
    }

    respond(req, res, result, 200, 'product/detail');
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to find product by barcode', 500, 'product/error');
  }
};

/**
 * Get featured products
 * GET /products/featured
 */
export const getFeaturedProducts = async (req: TypedRequest, res: Response): Promise<void> => {
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
export const getProductsByCategory = async (req: TypedRequest, res: Response): Promise<void> => {
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
export const getRelatedProducts = async (req: TypedRequest, res: Response): Promise<void> => {
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

// ============================================================================
// Customer Review Endpoints
// ============================================================================

export const getProductReviews = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { limit, offset } = req.query;
    const reviews = await productReviewRepo.findByProductId(
      productId,
      'approved',
      parseInt(limit as string) || 20,
      parseInt(offset as string) || 0,
    );
    const averageRating = await productReviewRepo.getAverageRating(productId);
    const ratingDistribution = await productReviewRepo.getRatingDistribution(productId);
    const totalCount = await productReviewRepo.countByProductId(productId, 'approved');
    respond(req, res, { reviews, averageRating, ratingDistribution, totalCount });
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to get reviews');
  }
};

export const createReview = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const customerId = req.user?.customerId;
    const { rating, title, content, reviewerName, reviewerEmail } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      respondError(req, res, 'Rating must be between 1 and 5', 400);
      return;
    }
    if (!reviewerName?.trim()) {
      respondError(req, res, 'Reviewer name is required', 400);
      return;
    }

    const review = await productReviewRepo.create({
      productId,
      customerId,
      rating,
      title,
      content,
      reviewerName,
      reviewerEmail,
      isVerifiedPurchase: !!customerId,
      status: 'pending',
    });
    respond(req, res, review, 201);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to create review', 400);
  }
};

export const markReviewHelpful = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const review = await productReviewRepo.incrementHelpful(req.params.reviewId);
    if (!review) {
      respondError(req, res, 'Review not found', 404);
      return;
    }
    respond(req, res, review);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to mark review helpful');
  }
};

export const reportReview = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const review = await productReviewRepo.incrementReport(req.params.reviewId);
    if (!review) {
      respondError(req, res, 'Review not found', 404);
      return;
    }
    respond(req, res, { reported: true });
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to report review');
  }
};

// ============================================================================
// Q&A (Customer)
// ============================================================================

/**
 * List approved Q&A for a product (customer-facing)
 * GET /products/:productId/qa
 */
export const listProductQaCustomer = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const qa = await productQaRepo.findByProduct(productId, 'approved');
    successResponse(res, qa);
  } catch (error: any) {
    logger.error('Error listing product Q&A:', error);
    errorResponse(res, error.message || 'Failed to list product Q&A');
  }
};

/**
 * Submit a Q&A question for a product
 * POST /products/:productId/qa
 */
export const submitProductQa = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const customerId = req.user?.customerId;
    const { question, askerName, askerEmail } = req.body;

    if (!question?.trim()) {
      errorResponse(res, 'question is required', 400);
      return;
    }

    const command = new SubmitProductQaCommand(productId, question, customerId, askerName, askerEmail);
    const useCase = new SubmitProductQaUseCase();
    const result = await useCase.execute(command);
    successResponse(res, result, 201);
  } catch (error: any) {
    logger.error('Error submitting product Q&A:', error);
    const status = error.message.includes('not found') ? 404 : 400;
    errorResponse(res, error.message || 'Failed to submit Q&A', status);
  }
};

/**
 * Vote on a product review
 * POST /products/:productId/reviews/:reviewId/vote
 */
export const voteOnReview = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const customerId = req.user?.customerId;
    const { isHelpful } = req.body;

    if (!customerId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    if (typeof isHelpful !== 'boolean') {
      errorResponse(res, 'isHelpful (boolean) is required', 400);
      return;
    }

    const command = new VoteOnReviewCommand(reviewId, customerId, isHelpful);
    const useCase = new VoteOnReviewUseCase();
    const result = await useCase.execute(command);
    successResponse(res, result);
  } catch (error: any) {
    logger.error('Error voting on review:', error);
    errorResponse(res, error.message || 'Failed to vote on review', 400);
  }
};
