/**
 * Storefront Review Controller
 * Manages product reviews from customers
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';;
import { query, queryOne } from '../../../libs/db';
import { storefrontRespond } from '../../respond';

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
  try {
    const { productId } = req.params;
    const { page = '1' } = req.query;
    const limit = 10;
    const offset = (parseInt(page as string) - 1) * limit;

    const reviews = await query<any[]>(
      `SELECT r."productReviewId", r."rating", r."title", r."content", r."reviewerName",
              r."isVerifiedPurchase", r."helpfulCount", r."createdAt"
       FROM "productReview" r
       WHERE r."productId" = $1 AND r."status" = 'approved'
       ORDER BY r."createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [productId, limit, offset],
    );

    const stats = await queryOne<any>(
      `SELECT COUNT(*) as "totalReviews", AVG("rating") as "averageRating"
       FROM "productReview"
       WHERE "productId" = $1 AND "status" = 'approved'`,
      [productId],
    );

    res.json({
      success: true,
      data: {
        reviews: reviews || [],
        totalReviews: parseInt(stats?.totalReviews || '0'),
        averageRating: parseFloat(stats?.averageRating || '0'),
      },
    });
  } catch (error) {
    logger.error('Error loading reviews:', error);
    res.status(500).json({ error: 'Failed to load reviews' });
  }
};

/**
 * POST: Submit a product review
 */
export const submitReview = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.status(401).json({ error: 'Please sign in to leave a review' });
    }

    const { productId } = req.params;
    const { rating, title, content } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if customer already reviewed this product
    const existing = await queryOne<any>(
      `SELECT "productReviewId" FROM "productReview" WHERE "customerId" = $1 AND "productId" = $2`,
      [user.customerId, productId],
    );

    if (existing) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    // Check if customer purchased this product
    const purchase = await queryOne<any>(
      `SELECT oi."orderItemId" FROM "orderItem" oi
       JOIN "order" o ON oi."orderId" = o."orderId"
       WHERE o."customerId" = $1 AND oi."productId" = $2 AND o."status" != 'cancelled'
       LIMIT 1`,
      [user.customerId, productId],
    );

    const result = await queryOne<any>(
      `INSERT INTO "productReview" (
        "productId", "customerId", "rating", "title", "content",
        "status", "isVerifiedPurchase", "reviewerName", "reviewerEmail",
        "helpfulCount", "unhelpfulCount", "reportCount", "isHighlighted",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, 0, 0, 0, false, NOW(), NOW())
      RETURNING "productReviewId"`,
      [
        productId,
        user.customerId,
        rating,
        title || null,
        content || null,
        !!purchase,
        user.name || 'Anonymous',
        user.email,
      ],
    );

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, reviewId: result?.productReviewId });
    }
    return res.redirect(`/products/${productId}`);
  } catch (error) {
    logger.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
};

/**
 * POST: Mark review as helpful
 */
export const markReviewHelpful = async (req: TypedRequest, res: Response) => {
  try {
    const { reviewId } = req.params;

    await queryOne<any>(
      `UPDATE "productReview" SET "helpfulCount" = "helpfulCount" + 1, "updatedAt" = NOW()
       WHERE "productReviewId" = $1 RETURNING "productReviewId"`,
      [reviewId],
    );

    res.json({ success: true });
  } catch (error) {
    logger.error('Error marking review helpful:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
};
