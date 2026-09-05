 
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Product Customer Controller
 * HTTP interface for customer-facing product operations
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import productCatalogRepository from '../../infrastructure/repositories/ProductCatalogRepository';
import productEngagementRepository from '../../infrastructure/repositories/ProductEngagementRepository';
import { GetProductCommand } from '../../application/useCases/GetProduct';
import { ListProductsCommand } from '../../application/useCases/ListProducts';
import { SearchProductsCommand } from '../../application/useCases/SearchProducts';
import { SubmitProductQaCommand } from '../../application/useCases/SubmitProductQa';
import { VoteOnReviewCommand } from '../../application/useCases/VoteOnReview';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
import type { ReviewRating } from '../../infrastructure/repositories/ProductEngagementRepository';
import {
  listProductsUseCase,
  getProductUseCase,
  searchProductsUseCase,
  submitProductQaUseCase,
  voteOnReviewUseCase,
} from '../../application/useCases/wired';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import { InventoryStockAvailabilityAdapter } from '../../infrastructure/acl/InventoryStockAvailabilityAdapter';

const ProductRepo = productCatalogRepository.productRepository;
const productReviewRepo = productEngagementRepository.reviews;
const productQaRepo = productEngagementRepository.qa;
const productVariantRepo = productCatalogRepository.variants;
const productDownloadRepo = productCatalogRepository.downloads;

// ============================================================================
// Content Negotiation Helpers
// ============================================================================

function respond(req: TypedRequest, res: Response, data: unknown, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data });
}

function respondError(req: TypedRequest, res: Response, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({ success: false, error: message });
}

// ============================================================================
// Controller Actions
// ============================================================================

/**
 * List products (storefront)
 * GET /products
 */
export const listProducts = async (req: TypedRequest, res: Response): Promise<void> => {
  const { categoryId, priceMin, priceMax, isFeatured, tags, limit, offset, orderBy, orderDirection } = req.query;

  const filters: {
    status?: ProductStatus | ProductStatus[];
    visibility?: ProductVisibility | ProductVisibility[];
    categoryId?: string;
    priceMin?: number;
    priceMax?: number;
    isFeatured?: boolean;
    tags?: string[];
  } = {
    status: ProductStatus.ACTIVE,
    visibility: [ProductVisibility.VISIBLE, ProductVisibility.FEATURED],
  };
  if (categoryId) filters.categoryId = categoryId as string;
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

  const useCase = listProductsUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result, 200);
  
};

/**
 * Get product by ID or slug
 * GET /products/:identifier
 */
export const getProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  const { identifier } = req.params;

  // Determine if identifier is UUID or slug
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

  const command = new GetProductCommand(isUuid ? identifier : undefined, isUuid ? undefined : identifier, undefined, true, true);

  const useCase = getProductUseCase;
  const product = await useCase.execute(command);

  if (!product) {
    respondError(req, res, 'Product not found', 404);
    return;
  }

  // Only show active and visible products to customers
  if (product.status !== 'active' || !['visible', 'featured'].includes(product.visibility)) {
    respondError(req, res, 'Product not found', 404);
    return;
  }

  respond(req, res, product, 200);
  
};

/**
 * Search products
 * GET /products/search
 */
const searchProducts = async (req: TypedRequest, res: Response): Promise<void> => {
  const { q, categoryId, priceMin, priceMax, limit, offset, orderBy } = req.query;

  if (!q) {
    respond(req, res, { products: [], total: 0, query: '' }, 200);
    return;
  }

  const filters: {
    categoryId?: string;
    priceMin?: number;
    priceMax?: number;
  } = {};
  if (categoryId) filters.categoryId = categoryId as string;
  if (priceMin) filters.priceMin = parseFloat(priceMin as string);
  if (priceMax) filters.priceMax = parseFloat(priceMax as string);

  const command = new SearchProductsCommand(
    q as string,
    filters,
    parseInt(limit as string) || 20,
    parseInt(offset as string) || 0,
    (orderBy as 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'name') || 'relevance',
  );

  const useCase = searchProductsUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result, 200);
  
};

/**
 * Get product by variant barcode
 * GET /products/barcode/:barcode
 */
export const findByBarcode = async (req: TypedRequest, res: Response): Promise<void> => {
  const { barcode } = req.params;

  if (!barcode?.trim()) {
    respondError(req, res, 'Barcode is required', 400);
    return;
  }

  const result = await ProductRepo.findByBarcode(barcode);
  if (!result) {
    respondError(req, res, 'Product not found', 404);
    return;
  }

  // Only expose active and visible products to customers
  if (result.product.status !== 'active' || !['visible', 'featured'].includes(result.product.visibility)) {
    respondError(req, res, 'Product not found', 404);
    return;
  }

  respond(req, res, result, 200);
  
};

/**
 * Get featured products
 * GET /products/featured
 */
export const getFeaturedProducts = async (req: TypedRequest, res: Response): Promise<void> => {
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

  const useCase = listProductsUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result, 200);
  
};

/**
 * Get products by category
 * GET /products/category/:categoryId
 */
export const getProductsByCategory = async (req: TypedRequest, res: Response): Promise<void> => {
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

  const useCase = listProductsUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result, 200);
  
};

/**
 * Get related products
 * GET /products/:productId/related
 */
export const getRelatedProducts = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const { limit } = req.query;

  const products = await ProductRepo.findRelated(productId, parseInt(limit as string) || 8);

  respond(req, res, { products }, 200);
  
};

// ============================================================================
// Customer Review Endpoints
// ============================================================================

export const getProductReviews = async (req: TypedRequest, res: Response): Promise<void> => {
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
  
};

export const createReview = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const customerId = req.user?.customerId || req.user?.id;
  const { rating, title, content, reviewerName, reviewerEmail } = req.body as { rating?: number; title?: string; content?: string; reviewerName?: string; reviewerEmail?: string };

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
    rating: rating as ReviewRating,
    title,
    content,
    reviewerName,
    reviewerEmail,
    isVerifiedPurchase: !!customerId,
    status: 'pending',
  });
  respond(req, res, review, 201);
  
};

export const markReviewHelpful = async (req: TypedRequest, res: Response): Promise<void> => {
  const review = await productReviewRepo.incrementHelpful(req.params.reviewId);
  if (!review) {
    respondError(req, res, 'Review not found', 404);
    return;
  }
  respond(req, res, review);
  
};

export const reportReview = async (req: TypedRequest, res: Response): Promise<void> => {
  const review = await productReviewRepo.incrementReport(req.params.reviewId);
  if (!review) {
    respondError(req, res, 'Review not found', 404);
    return;
  }
  respond(req, res, { reported: true });
  
};

// ============================================================================
// Q&A (Customer)
// ============================================================================

/**
 * List approved Q&A for a product (customer-facing)
 * GET /products/:productId/qa
 */
export const listProductQaCustomer = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const qa = await productQaRepo.findByProduct(productId, 'answered');
  successResponse(res, qa);
};

/**
 * Submit a Q&A question for a product
 * POST /products/:productId/qa
 */
export const submitProductQa = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const customerId = req.user?.customerId || req.user?.id;
  const { question, askerName, askerEmail } = req.body as { question?: string; askerName?: string; askerEmail?: string };

  if (!question?.trim()) {
    errorResponse(res, 'question is required', 400);
    return;
  }

  const command = new SubmitProductQaCommand(productId, question, customerId, askerName, askerEmail);
  const useCase = submitProductQaUseCase;
  const result = await useCase.execute(command);
  successResponse(res, result, 201);
};

/**
 * Vote on a product review
 * POST /products/:productId/reviews/:reviewId/vote
 */
export const voteOnReview = async (req: TypedRequest, res: Response): Promise<void> => {
  const { reviewId } = req.params;
  const customerId = req.user?.customerId || req.user?.id;
  const { isHelpful } = req.body as { isHelpful?: boolean };

  if (!customerId) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }
  if (typeof isHelpful !== 'boolean') {
    errorResponse(res, 'isHelpful (boolean) is required', 400);
    return;
  }

  const command = new VoteOnReviewCommand(reviewId, customerId, isHelpful);
  const useCase = voteOnReviewUseCase;
  const result = await useCase.execute(command);
  successResponse(res, result);
};

// ============================================================================
// Configurable Product (Customer)
// ============================================================================

export const configureVariant = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const { options } = req.body as { options?: Array<{ name: string; value: string }> };
  if (!options || !Array.isArray(options) || options.length === 0) {
    errorResponse(res, 'options array is required', 400);
    return;
  }
  const variants = await productVariantRepo.findByProductId(productId);
  const match = variants.find(v =>
    options.every((reqOpt: { name: string; value: string }) =>
      v.options.some((vOpt: { name: string; value: string }) => vOpt.name === reqOpt.name && vOpt.value === reqOpt.value),
    ),
  );
  if (!match) {
    errorResponse(res, 'No matching variant found for the given options', 404);
    return;
  }
  successResponse(res, match);
};

// ============================================================================
// Product Downloads (Customer)
// ============================================================================

export const getProductDownloads = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const downloads = await productDownloadRepo.findByProductId(productId, undefined, true);
  successResponse(res, downloads);
};

// ============================================================================
// Product Availability (Customer)
// ============================================================================

export const getProductAvailability = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const { variantId, quantity } = req.query;

  const requiredQty = quantity ? parseInt(String(quantity)) : 1;
  const stockPort = new InventoryStockAvailabilityAdapter();
  const availability = await stockPort.checkAvailability({
    productId,
    productVariantId: variantId ? String(variantId) : undefined,
    quantity: requiredQty,
  });

  const totalStock = await stockPort.getTotalStock(productId);

  respond(req, res, {
    productId,
    variantId: variantId ? String(variantId) : undefined,
    available: availability.available,
    totalAvailable: availability.totalAvailable,
    requestedQuantity: requiredQty,
    inStock: availability.totalAvailable > 0,
    totalStockAcrossLocations: totalStock,
    locationCount: availability.locationCount,
  }, 200);
  
};
