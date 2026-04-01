import { query, queryOne } from '../../../../libs/db';

export interface ProductQaVote {
  productQaVoteId: string;
  createdAt: string;
  productQaId: string;
  customerId: string;
  isHelpful: boolean;
}

export type ProductQaVoteCreateParams = Omit<ProductQaVote, 'productQaVoteId' | 'createdAt'>;

export class ProductQaVoteRepo {
  async findByQuestion(productQaId: string): Promise<ProductQaVote[]> {
    return (
      (await query<ProductQaVote[]>(
        `SELECT * FROM "productQaVote" WHERE "productQaId" = $1 ORDER BY "createdAt" DESC`,
        [productQaId],
      )) || []
    );
  }

  async create(params: ProductQaVoteCreateParams): Promise<ProductQaVote> {
    const now = new Date();
    const result = await queryOne<ProductQaVote>(
      `INSERT INTO "productQaVote" ("productQaId", "customerId", "isHelpful", "createdAt")
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [params.productQaId, params.customerId, params.isHelpful, now],
    );
    if (!result) throw new Error('Failed to create productQaVote');
    return result;
  }

  async countByQuestion(productQaId: string): Promise<{ helpful: number; unhelpful: number }> {
    const result = await queryOne<{ helpful: string; unhelpful: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE "isHelpful" = true) AS helpful,
         COUNT(*) FILTER (WHERE "isHelpful" = false) AS unhelpful
       FROM "productQaVote"
       WHERE "productQaId" = $1`,
      [productQaId],
    );
    return {
      helpful: result ? parseInt(result.helpful, 10) : 0,
      unhelpful: result ? parseInt(result.unhelpful, 10) : 0,
    };
  }
}

export default new ProductQaVoteRepo();
