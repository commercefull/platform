import { jsonResponse, redirectResponse } from "libs/apiResponse";
/**
 * Storefront Review Controller
 * Manages product reviews from customers
 */

import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { manageProductReviewsUseCase } from '../../application/useCases/wired';
import type { ReviewRating } from '../../domain/repositories/ProductCatalogPorts';

interface CustomerUser {
  id: string;
  customerId: string;
  email: string;
  name?: string;
}

/**
 * GET: List reviews for a product
 */
export const getProductReviews = async (req: HttpRequest, res: HttpResponse) => {
  const { productId } = req.params;
  const { page = '1' } = req.query;
  const limit = 10;
  const offset = (parseInt(page as string) - 1) * limit;

  const reviews = await manageProductReviewsUseCase.findByProductId(productId, 'approved', limit, offset);
  const stats = await manageProductReviewsUseCase.getProductStatistics(productId);

  jsonResponse(res, 200, {
        success: true,
        data: {
          reviews,
          totalReviews: stats.totalReviews,
          averageRating: stats.averageRating,
        },
      });
};

/**
 * POST: Submit a product review
 */
export const submitReview = async (req: HttpRequest, res: HttpResponse) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return jsonResponse(res, 401, { error: 'Please sign in to leave a review' });
  }

  const { productId } = req.params;
  const body = req.body as HttpRequestBody;
  const { rating, title, content } = body as { rating: ReviewRating; title?: string; content?: string };

  if (!rating || (rating as number) < 1 || (rating as number) > 5) {
    return jsonResponse(res, 400, { error: 'Rating must be between 1 and 5' });
  }

  const existing = await manageProductReviewsUseCase.findByCustomerAndProduct(user.customerId, productId);

  if (existing) {
    return jsonResponse(res, 400, { error: 'You have already reviewed this product' });
  }

  const isVerifiedPurchase = await manageProductReviewsUseCase.checkCustomerPurchase(user.customerId, productId);

  const result = await manageProductReviewsUseCase.create({
    productId,
    customerId: user.customerId,
    rating,
    title: title || null,
    content: content || null,
    status: 'pending',
    isVerifiedPurchase,
    reviewerName: user.name || 'Anonymous',
    reviewerEmail: user.email,
  } as Parameters<typeof manageProductReviewsUseCase.create>[0]);

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return jsonResponse(res, 200, { success: true, reviewId: result.productReviewId });
  }
  return redirectResponse(res, `/products/${productId}`);
};

/**
 * POST: Mark review as helpful
 */
export const markReviewHelpful = async (req: HttpRequest, res: HttpResponse) => {
  const { reviewId } = req.params;

  await manageProductReviewsUseCase.incrementHelpful(reviewId);

  jsonResponse(res, 200, { success: true });
};
