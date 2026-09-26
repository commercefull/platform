/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Product Customer Controller
 * HTTP interface for customer-facing product operations
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { GetProductCommand } from '../../application/useCases/GetProduct';
import { ListProductsCommand } from '../../application/useCases/ListProducts';
import { SearchProductsCommand } from '../../application/useCases/SearchProducts';
import { SubmitProductQaCommand } from '../../application/useCases/SubmitProductQa';
import { VoteOnReviewCommand } from '../../application/useCases/VoteOnReview';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
import {
  listProductsUseCase,
  getProductUseCase,
  searchProductsUseCase,
  submitProductQaUseCase,
  voteOnReviewUseCase,
  manageProductReviewsUseCase,
  manageProductQaUseCase,
  manageProductDownloadsUseCase,
  configureVariantUseCase,
} from '../../application/useCases/wired';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import { stockAvailabilityPort } from '../../application/wired';
import { getErrorMessage, getErrorStatusCode } from '../../../../libs/errors';
import type { CatalogVariantOption } from '../../application/ports/CatalogVariantPort';

// ============================================================================
// Content Negotiation Helpers
// ============================================================================

function respond(req: HttpRequest, res: HttpResponse, data: unknown, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data });
}

function respondError(req: HttpRequest, res: HttpResponse, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({ success: false, error: message });
}

// ============================================================================
// Controller Actions
// ============================================================================

/**
 * List products (storefront)
 * GET /products
 */
export const listProducts = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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
export const getProduct = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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
const searchProducts = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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
export const findByBarcode = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { barcode } = req.params;

  if (!barcode?.trim()) {
    respondError(req, res, 'Barcode is required', 400);
    return;
  }

  const result = await getProductUseCase.findByBarcode(barcode);
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
export const getFeaturedProducts = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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
export const getProductsByCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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
export const getRelatedProducts = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const { limit } = req.query;

  const products = await getProductUseCase.findRelated(productId, parseInt(limit as string) || 8);

  respond(req, res, { products }, 200);
};

// ============================================================================
// Customer Review Endpoints
// ============================================================================

export const getProductReviews = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const { limit, offset } = req.query;
  const result = await manageProductReviewsUseCase.getApprovedReviewsWithStats(
    productId,
    parseInt(limit as string) || 20,
    parseInt(offset as string) || 0,
  );
  respond(req, res, result);
};

export const createReview = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const customerId = req.user?.customerId || req.user?.id;
  const { rating, title, content, reviewerName, reviewerEmail } = req.body as {
    rating?: number;
    title?: string;
    content?: string;
    reviewerName?: string;
    reviewerEmail?: string;
  };

  try {
    const review = await manageProductReviewsUseCase.submitReview({
      productId,
      customerId,
      rating,
      title,
      content,
      reviewerName,
      reviewerEmail,
    });
    respond(req, res, review, 201);
  } catch (error) {
    respondError(req, res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const markReviewHelpful = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const review = await manageProductReviewsUseCase.incrementHelpful(req.params.reviewId);
  if (!review) {
    respondError(req, res, 'Review not found', 404);
    return;
  }
  respond(req, res, review);
};

export const reportReview = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const review = await manageProductReviewsUseCase.incrementReport(req.params.reviewId);
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
export const listProductQaCustomer = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const qa = await manageProductQaUseCase.findByProduct(productId, 'answered');
  successResponse(res, qa);
};

/**
 * Submit a Q&A question for a product
 * POST /products/:productId/qa
 */
export const submitProductQa = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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
export const voteOnReview = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const configureVariant = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const { options } = req.body as { options?: Array<{ name: string; value: string }> };
  try {
    const match = await configureVariantUseCase.execute(productId, options as CatalogVariantOption[]);
    successResponse(res, match);
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

// ============================================================================
// Product Downloads (Customer)
// ============================================================================

export const getProductDownloads = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const downloads = await manageProductDownloadsUseCase.listForProduct(productId, true);
  successResponse(res, downloads);
};

// ============================================================================
// Product Availability (Customer)
// ============================================================================

export const getProductAvailability = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const { variantId, quantity } = req.query;

  const requiredQty = quantity ? parseInt(String(quantity)) : 1;
  const availability = await stockAvailabilityPort.checkAvailability({
    productId,
    productVariantId: variantId ? String(variantId) : undefined,
    quantity: requiredQty,
  });

  const totalStock = await stockAvailabilityPort.getTotalStock(productId);

  respond(
    req,
    res,
    {
      productId,
      variantId: variantId ? String(variantId) : undefined,
      available: availability.available,
      totalAvailable: availability.totalAvailable,
      requestedQuantity: requiredQty,
      inStock: availability.totalAvailable > 0,
      totalStockAcrossLocations: totalStock,
      locationCount: availability.locationCount,
    },
    200,
  );
};
