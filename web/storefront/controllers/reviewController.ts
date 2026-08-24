/**
 * Storefront Review Controller
 * Manages product reviews from customers
 */

import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ManageProductReviewsUseCase } from '../../../modules/product/application/useCases/ManageProductReviews';

const manageProductReviewsUseCase = new ManageProductReviewsUseCase();

interface CustomerUser {
  id: string;
  customerId: string;
  email: string;
  name?: string;
}

/**
 * GET: List reviews for a product
 */
export const getProductReviews = async (req: TypedRequest, res: Response) => {
  const { productId } = req.params;
  const { page = '1' } = req.query;
  const limit = 10;
  const offset = (parseInt(page as string) - 1) * limit;

  const reviews = await manageProductReviewsUseCase.findByProductId(productId, 'approved', limit, offset);
  const stats = await manageProductReviewsUseCase.getProductStatistics(productId);

  res.json({
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
export const submitReview = async (req: TypedRequest, res: Response) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.status(401).json({ error: 'Please sign in to leave a review' });
  }

  const { productId } = req.params;
  const body = req.body as RequestBody;
  const { rating, title, content } = body;

  if (!rating || (rating as number) < 1 || (rating as number) > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const existing = await manageProductReviewsUseCase.findByCustomerAndProduct(user.customerId, productId);

  if (existing) {
    return res.status(400).json({ error: 'You have already reviewed this product' });
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
  });

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ success: true, reviewId: result.productReviewId });
  }
  return res.redirect(`/products/${productId}`);
  
};

/**
 * POST: Mark review as helpful
 */
export const markReviewHelpful = async (req: TypedRequest, res: Response) => {
  const { reviewId } = req.params;

  await manageProductReviewsUseCase.incrementHelpful(reviewId);

  res.json({ success: true });
  
};
