import { query, queryOne } from '../../../../libs/db';

export interface ProductReviewVote {
  productReviewVoteId: string;
  createdAt: string;
  productReviewId: string;
  customerId: string;
  isHelpful: boolean;
}

export type ProductReviewVoteCreateParams = Omit<ProductReviewVote, 'productReviewVoteId' | 'createdAt'>;

export class ProductReviewVoteRepo {
  async findByReview(productReviewId: string): Promise<ProductReviewVote[]> {
    return (
      (await query<ProductReviewVote[]>(
        `SELECT * FROM "productReviewVote" WHERE "productReviewId" = $1 ORDER BY "createdAt" DESC`,
        [productReviewId],
      )) || []
    );
  }

  async findByCustomer(productReviewId: string, customerId: string): Promise<ProductReviewVote | null> {
    return queryOne<ProductReviewVote>(
      `SELECT * FROM "productReviewVote" WHERE "productReviewId" = $1 AND "customerId" = $2`,
      [productReviewId, customerId],
    );
  }

  async create(params: ProductReviewVoteCreateParams): Promise<ProductReviewVote | null> {
    const now = new Date();
    return queryOne<ProductReviewVote>(
      `INSERT INTO "productReviewVote" ("productReviewId", "customerId", "isHelpful", "createdAt")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [params.productReviewId, params.customerId, params.isHelpful, now],
    );
  }

  async countByReview(productReviewId: string): Promise<{ helpful: number; unhelpful: number }> {
    const result = await queryOne<{ helpful: string; unhelpful: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE "isHelpful" = true) AS helpful,
         COUNT(*) FILTER (WHERE "isHelpful" = false) AS unhelpful
       FROM "productReviewVote"
       WHERE "productReviewId" = $1`,
      [productReviewId],
    );
    return {
      helpful: result ? parseInt(result.helpful, 10) : 0,
      unhelpful: result ? parseInt(result.unhelpful, 10) : 0,
    };
  }
}

export default new ProductReviewVoteRepo();
