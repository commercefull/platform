import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export interface ProductReview {
  productReviewId: string;
  createdAt: string;
  updatedAt: string;
  productId: string;
  productVariantId?: string;
  customerId?: string;
  orderId?: string;
  rating: ReviewRating;
  title?: string;
  content?: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  isHighlighted: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  reportCount: number;
  reviewerName?: string;
  reviewerEmail?: string;
  adminResponse?: string;
  adminResponseDate?: string;
}

export type ProductReviewCreateParams = Omit<
  ProductReview,
  'productReviewId' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'unhelpfulCount' | 'reportCount' | 'isHighlighted'
>;

export type ProductReviewUpdateParams = Partial<
  Pick<ProductReview, 'rating' | 'title' | 'content' | 'status' | 'isHighlighted' | 'adminResponse' | 'adminResponseDate'>
>;

export interface ReviewFilters {
  productId?: string;
  productVariantId?: string;
  customerId?: string;
  status?: ReviewStatus;
  rating?: ReviewRating;
  isVerifiedPurchase?: boolean;
  isHighlighted?: boolean;
  minRating?: number;
  maxRating?: number;
}

export class ProductReviewRepo {
  /**
   * Find review by ID
   */
  async findById(productReviewId: string): Promise<ProductReview | null> {
    return await queryOne<ProductReview>(`SELECT * FROM "public"."productReview" WHERE "productReviewId" = $1`, [productReviewId]);
  }

  /**
   * Find all reviews for a product
   */
  async findByProductId(productId: string, status?: ReviewStatus, limit: number = 50, offset: number = 0): Promise<ProductReview[]> {
    let sql = `SELECT * FROM "public"."productReview" WHERE "productId" = $1`;
    const params: any[] = [productId];

    if (status) {
      sql += ` AND "status" = $2`;
      params.push(status);
    }

    sql += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const results = await query<ProductReview[]>(sql, params);
    return results || [];
  }

  /**
   * Find reviews by customer
   */
  async findByCustomerId(customerId: string, limit: number = 50, offset: number = 0): Promise<ProductReview[]> {
    const results = await query<ProductReview[]>(
      `SELECT * FROM "public"."productReview" 
       WHERE "customerId" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT $2 OFFSET $3`,
      [customerId, limit, offset],
    );
    return results || [];
  }

  /**
   * Find reviews with filters
   */
  async findWithFilters(filters: ReviewFilters, limit: number = 50, offset: number = 0): Promise<ProductReview[]> {
    const conditions: string[] = [];
    const params: any[] = [];
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

    const results = await query<ProductReview[]>(
      `SELECT * FROM "public"."productReview" 
       ${whereClause}
       ORDER BY "createdAt" DESC 
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params,
    );

    return results || [];
  }

  /**
   * Find pending reviews
   */
  async findPending(limit: number = 50, offset: number = 0): Promise<ProductReview[]> {
    const results = await query<ProductReview[]>(
      `SELECT * FROM "public"."productReview" 
       WHERE "status" = 'pending' 
       ORDER BY "createdAt" ASC 
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return results || [];
  }

  /**
   * Find highlighted reviews
   */
  async findHighlighted(productId?: string, limit: number = 10): Promise<ProductReview[]> {
    let sql = `SELECT * FROM "public"."productReview" WHERE "isHighlighted" = true AND "status" = 'approved'`;
    const params: any[] = [];

    if (productId) {
      sql += ` AND "productId" = $1`;
      params.push(productId);
    }

    sql += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const results = await query<ProductReview[]>(sql, params);
    return results || [];
  }

  /**
   * Create product review
   */
  async create(params: ProductReviewCreateParams): Promise<ProductReview> {
    const now = unixTimestamp();

    const result = await queryOne<ProductReview>(
      `INSERT INTO "public"."productReview" (
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
      throw new Error('Failed to create product review');
    }

    return result;
  }

  /**
   * Update product review
   */
  async update(productReviewId: string, params: ProductReviewUpdateParams): Promise<ProductReview | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
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

    const result = await queryOne<ProductReview>(
      `UPDATE "public"."productReview" 
       SET ${updateFields.join(', ')}
       WHERE "productReviewId" = $${paramIndex}
       RETURNING *`,
      values,
    );

    return result;
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
      adminResponseDate: unixTimestamp(),
    });
  }

  /**
   * Increment helpful count
   */
  async incrementHelpful(productReviewId: string): Promise<ProductReview | null> {
    const result = await queryOne<ProductReview>(
      `UPDATE "public"."productReview" 
       SET "helpfulCount" = "helpfulCount" + 1, "updatedAt" = $1
       WHERE "productReviewId" = $2
       RETURNING *`,
      [unixTimestamp(), productReviewId],
    );

    return result;
  }

  /**
   * Increment unhelpful count
   */
  async incrementUnhelpful(productReviewId: string): Promise<ProductReview | null> {
    const result = await queryOne<ProductReview>(
      `UPDATE "public"."productReview" 
       SET "unhelpfulCount" = "unhelpfulCount" + 1, "updatedAt" = $1
       WHERE "productReviewId" = $2
       RETURNING *`,
      [unixTimestamp(), productReviewId],
    );

    return result;
  }

  /**
   * Increment report count
   */
  async incrementReport(productReviewId: string): Promise<ProductReview | null> {
    const result = await queryOne<ProductReview>(
      `UPDATE "public"."productReview" 
       SET "reportCount" = "reportCount" + 1, "updatedAt" = $1
       WHERE "productReviewId" = $2
       RETURNING *`,
      [unixTimestamp(), productReviewId],
    );

    return result;
  }

  /**
   * Delete review
   */
  async delete(productReviewId: string): Promise<boolean> {
    const result = await queryOne<{ productReviewId: string }>(
      `DELETE FROM "public"."productReview" WHERE "productReviewId" = $1 RETURNING "productReviewId"`,
      [productReviewId],
    );

    return !!result;
  }

  /**
   * Count reviews for product
   */
  async countByProductId(productId: string, status?: ReviewStatus): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "public"."productReview" WHERE "productId" = $1`;
    const params: any[] = [productId];

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
       FROM "public"."productReview" 
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
       FROM "public"."productReview" 
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
       FROM "public"."productReview" 
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
}

export default new ProductReviewRepo();
