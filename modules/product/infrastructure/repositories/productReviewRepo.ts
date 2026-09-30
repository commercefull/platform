import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';
import { FailedToCreateProductError } from '../../domain/errors/ProductErrors';
import type { ProductReview as DbProductReview } from '../../../../libs/db/types';

import type {
  ReviewStatus,
  ReviewRating,
  ProductReview,
  ProductReviewCreateParams,
  ProductReviewUpdateParams,
  ReviewFilters,
} from '../../domain/repositories/ProductCatalogPorts';
export type {
  ReviewStatus,
  ReviewRating,
  ProductReview,
  ProductReviewCreateParams,
  ProductReviewUpdateParams,
  ReviewFilters,
} from '../../domain/repositories/ProductCatalogPorts';

const toDate = (d: Date | string | null | undefined): Date | undefined =>
  d == null ? undefined : d instanceof Date ? d : new Date(d);
const toDateReq = (d: Date | string): Date => (d instanceof Date ? d : new Date(d));

function mapToReview(row: DbProductReview): ProductReview {
  return {
    productReviewId: row.productReviewId,
    productId: row.productId,
    rating: row.rating as ReviewRating,
    status: row.status as ReviewStatus,
    isVerifiedPurchase: row.isVerifiedPurchase,
    isHighlighted: row.isHighlighted,
    helpfulCount: row.helpfulCount,
    unhelpfulCount: row.unhelpfulCount,
    reportCount: row.reportCount,
    productVariantId: row.productVariantId ?? undefined,
    customerId: row.customerId ?? undefined,
    orderId: row.orderId ?? undefined,
    title: row.title ?? undefined,
    content: row.content ?? undefined,
    reviewerName: row.reviewerName ?? undefined,
    reviewerEmail: row.reviewerEmail ?? undefined,
    adminResponse: row.adminResponse ?? undefined,
    adminResponseDate: toDate(row.adminResponseDate),
    createdAt: toDateReq(row.createdAt),
    updatedAt: toDateReq(row.updatedAt),
  };
}







export class ProductReviewRepo {
  /**
   * Find review by ID
   */
  async findById(productReviewId: string): Promise<ProductReview | null> {
    const row = await queryOne<DbProductReview>(`SELECT * FROM "productReview" WHERE "productReviewId" = $1`, [productReviewId]);
    return row ? mapToReview(row) : null;
  }

  /**
   * Find all reviews for a product
   */
  async findByProductId(productId: string, status?: ReviewStatus, limit: number = 50, offset: number = 0): Promise<ProductReview[]> {
    let sql = `SELECT * FROM "productReview" WHERE "productId" = $1`;
    const params: unknown[] = [productId];

    if (status) {
      sql += ` AND "status" = $2`;
      params.push(status);
    }

    sql += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const results = await query<DbProductReview[]>(sql, params);
    return (results || []).map(mapToReview);
  }

  /**
   * Find reviews by customer
   */
  async findByCustomerId(customerId: string, limit: number = 50, offset: number = 0): Promise<ProductReview[]> {
    const results = await query<DbProductReview[]>(
      `SELECT * FROM "productReview" 
       WHERE "customerId" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT $2 OFFSET $3`,
      [customerId, limit, offset],
    );
    return (results || []).map(mapToReview);
  }

  /**
   * Find reviews with filters
   */
  async findWithFilters(filters: ReviewFilters, limit: number = 50, offset: number = 0): Promise<ProductReview[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.productId) {
      conditions.push(`"productId" = $${paramIndex++}`);
      params.push(filters.productId);
    }

    if (filters.productVariantId) {
      conditions.push(`"productVariantId" = $${paramIndex++}`);
      params.push(filters.productVariantId);
    }

    if (filters.customerId) {
      conditions.push(`"customerId" = $${paramIndex++}`);
      params.push(filters.customerId);
    }

    if (filters.status) {
      conditions.push(`"status" = $${paramIndex++}`);
      params.push(filters.status);
    }

    if (filters.rating) {
      conditions.push(`"rating" = $${paramIndex++}`);
      params.push(filters.rating);
    }

    if (filters.minRating) {
      conditions.push(`"rating" >= $${paramIndex++}`);
      params.push(filters.minRating);
    }

    if (filters.maxRating) {
      conditions.push(`"rating" <= $${paramIndex++}`);
      params.push(filters.maxRating);
    }

    if (filters.isVerifiedPurchase !== undefined) {
      conditions.push(`"isVerifiedPurchase" = $${paramIndex++}`);
      params.push(filters.isVerifiedPurchase);
    }

    if (filters.isHighlighted !== undefined) {
      conditions.push(`"isHighlighted" = $${paramIndex++}`);
      params.push(filters.isHighlighted);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(limit, offset);

    const results = await query<DbProductReview[]>(
      `SELECT * FROM "productReview" 
       ${whereClause}
       ORDER BY "createdAt" DESC 
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params,
    );

    return (results || []).map(mapToReview);
  }

  /**
   * Find pending reviews
   */
  async findPending(limit: number = 50, offset: number = 0): Promise<ProductReview[]> {
    const results = await query<DbProductReview[]>(
      `SELECT * FROM "productReview" 
       WHERE "status" = 'pending' 
       ORDER BY "createdAt" ASC 
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return (results || []).map(mapToReview);
  }

  /**
   * Find highlighted reviews
   */
  async findHighlighted(productId?: string, limit: number = 10): Promise<ProductReview[]> {
    let sql = `SELECT * FROM "productReview" WHERE "isHighlighted" = true AND "status" = 'approved'`;
    const params: unknown[] = [];

    if (productId) {
      sql += ` AND "productId" = $1`;
      params.push(productId);
    }

    sql += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const results = await query<DbProductReview[]>(sql, params);
    return (results || []).map(mapToReview);
  }

  /**
   * Create product review
   */
  async create(params: ProductReviewCreateParams): Promise<ProductReview> {
    const now = unixTimestamp();

    const result = await queryOne<DbProductReview>(
      `INSERT INTO "productReview" (
        "productId", "productVariantId", "customerId", "orderId",
        "rating", "title", "content", "status", "isVerifiedPurchase",
        "isHighlighted", "helpfulCount", "unhelpfulCount", "reportCount",
        "reviewerName", "reviewerEmail", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, false, 0, 0, 0, $10, $11, $12, $13
      )
      RETURNING *`,
      [
        params.productId,
        params.productVariantId || null,
        params.customerId || null,
        params.orderId || null,
        params.rating,
        params.title || null,
        params.content || null,
        params.status || 'pending',
        params.isVerifiedPurchase || false,
        params.reviewerName || null,
        params.reviewerEmail || null,
        now,
        now,
      ],
    );

    if (!result) {
      throw new FailedToCreateProductError();
    }

    return mapToReview(result);
  }

  /**
   * Update product review
   */
  async update(productReviewId: string, params: ProductReviewUpdateParams): Promise<ProductReview | null> {
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(productReviewId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(productReviewId);

    const result = await queryOne<DbProductReview>(
      `UPDATE "productReview" 
       SET ${updateFields.join(', ')}
       WHERE "productReviewId" = $${paramIndex}
       RETURNING *`,
      values,
    );

    return result ? mapToReview(result) : null;
  }

  /**
   * Update review status
   */
  async updateStatus(productReviewId: string, status: ReviewStatus): Promise<ProductReview | null> {
    return this.update(productReviewId, { status });
  }

  /**
   * Approve review
   */
  async approve(productReviewId: string): Promise<ProductReview | null> {
    return this.updateStatus(productReviewId, 'approved');
  }

  /**
   * Reject review
   */
  async reject(productReviewId: string): Promise<ProductReview | null> {
    return this.updateStatus(productReviewId, 'rejected');
  }

  /**
   * Highlight review
   */
  async highlight(productReviewId: string, highlighted: boolean = true): Promise<ProductReview | null> {
    return this.update(productReviewId, { isHighlighted: highlighted });
  }

  /**
   * Add admin response
   */
  async addAdminResponse(productReviewId: string, response: string): Promise<ProductReview | null> {
    return this.update(productReviewId, {
      adminResponse: response,
      adminResponseDate: new Date(),
    });
  }

  /**
   * Increment helpful count
   */
  async incrementHelpful(productReviewId: string): Promise<ProductReview | null> {
    const result = await queryOne<DbProductReview>(
      `UPDATE "productReview" 
       SET "helpfulCount" = "helpfulCount" + 1, "updatedAt" = $1
       WHERE "productReviewId" = $2
       RETURNING *`,
      [unixTimestamp(), productReviewId],
    );

    return result ? mapToReview(result) : null;
  }

  /**
   * Increment unhelpful count
   */
  async incrementUnhelpful(productReviewId: string): Promise<ProductReview | null> {
    const result = await queryOne<DbProductReview>(
      `UPDATE "productReview" 
       SET "unhelpfulCount" = "unhelpfulCount" + 1, "updatedAt" = $1
       WHERE "productReviewId" = $2
       RETURNING *`,
      [unixTimestamp(), productReviewId],
    );

    return result ? mapToReview(result) : null;
  }

  /**
   * Increment report count
   */
  async incrementReport(productReviewId: string): Promise<ProductReview | null> {
    const result = await queryOne<DbProductReview>(
      `UPDATE "productReview" 
       SET "reportCount" = "reportCount" + 1, "updatedAt" = $1
       WHERE "productReviewId" = $2
       RETURNING *`,
      [unixTimestamp(), productReviewId],
    );

    return result ? mapToReview(result) : null;
  }

  /**
   * Delete review
   */
  async delete(productReviewId: string): Promise<boolean> {
    const result = await queryOne<{ productReviewId: string }>(
      `DELETE FROM "productReview" WHERE "productReviewId" = $1 RETURNING "productReviewId"`,
      [productReviewId],
    );

    return !!result;
  }

  /**
   * Count reviews for product
   */
  async countByProductId(productId: string, status?: ReviewStatus): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "productReview" WHERE "productId" = $1`;
    const params: unknown[] = [productId];

    if (status) {
      sql += ` AND "status" = $2`;
      params.push(status);
    }

    const result = await queryOne<{ count: string }>(sql, params);

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Get average rating for product
   */
  async getAverageRating(productId: string): Promise<number> {
    const result = await queryOne<{ avg: string }>(
      `SELECT AVG("rating") as avg 
       FROM "productReview" 
       WHERE "productId" = $1 AND "status" = 'approved'`,
      [productId],
    );

    return result && result.avg ? parseFloat(result.avg) : 0;
  }

  /**
   * Get rating distribution for product
   */
  async getRatingDistribution(productId: string): Promise<Record<ReviewRating, number>> {
    const results = await query<{ rating: ReviewRating; count: string }[]>(
      `SELECT "rating", COUNT(*) as count 
       FROM "productReview" 
       WHERE "productId" = $1 AND "status" = 'approved'
       GROUP BY "rating"
       ORDER BY "rating" DESC`,
      [productId],
    );

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (results) {
      results.forEach(row => {
        distribution[row.rating] = parseInt(row.count, 10);
      });
    }

    return distribution as Record<ReviewRating, number>;
  }

  /**
   * Get review statistics for product
   */
  async getProductStatistics(productId: string): Promise<{
    totalReviews: number;
    averageRating: number;
    distribution: Record<ReviewRating, number>;
    verifiedPurchaseCount: number;
  }> {
    const totalReviews = await this.countByProductId(productId, 'approved');
    const averageRating = await this.getAverageRating(productId);
    const distribution = await this.getRatingDistribution(productId);

    const verifiedResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count 
       FROM "productReview" 
       WHERE "productId" = $1 AND "status" = 'approved' AND "isVerifiedPurchase" = true`,
      [productId],
    );
    const verifiedPurchaseCount = verifiedResult ? parseInt(verifiedResult.count, 10) : 0;

    return {
      totalReviews,
      averageRating,
      distribution,
      verifiedPurchaseCount,
    };
  }

  async findByCustomerAndProduct(customerId: string, productId: string): Promise<ProductReview | null> {
    return await queryOne<ProductReview>(`SELECT "productReviewId" FROM "productReview" WHERE "customerId" = $1 AND "productId" = $2`, [
      customerId,
      productId,
    ]);
  }

  async checkCustomerPurchase(customerId: string, productId: string): Promise<boolean> {
    const result = await queryOne<{ orderItemId: string }>(
      `SELECT oi."orderItemId" FROM "orderItem" oi
       JOIN "order" o ON oi."orderId" = o."orderId"
       WHERE o."customerId" = $1 AND oi."productId" = $2 AND o."status" != 'cancelled'
       LIMIT 1`,
      [customerId, productId],
    );
    return !!result;
  }
}

export default new ProductReviewRepo();
