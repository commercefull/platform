import { query, queryOne } from '../../../../libs/db';

export interface ProductReviewMedia {
  productReviewMediaId: string;
  createdAt: string;
  updatedAt: string;
  productReviewId: string;
  url: string;
  type: string;
  position: number;
}

export type ProductReviewMediaCreateParams = Omit<ProductReviewMedia, 'productReviewMediaId' | 'createdAt' | 'updatedAt'>;

export class ProductReviewMediaRepo {
  async findByReview(productReviewId: string): Promise<ProductReviewMedia[]> {
    return (
      (await query<ProductReviewMedia[]>(
        `SELECT * FROM "productReviewMedia" WHERE "productReviewId" = $1 ORDER BY "position" ASC`,
        [productReviewId],
      )) || []
    );
  }

  async create(params: ProductReviewMediaCreateParams): Promise<ProductReviewMedia> {
    const now = new Date();
    const result = await queryOne<ProductReviewMedia>(
      `INSERT INTO "productReviewMedia" ("productReviewId", "url", "type", "position", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [params.productReviewId, params.url, params.type, params.position ?? 0, now, now],
    );
    if (!result) throw new Error('Failed to create productReviewMedia');
    return result;
  }

  async delete(productReviewMediaId: string): Promise<boolean> {
    const result = await queryOne<{ productReviewMediaId: string }>(
      `DELETE FROM "productReviewMedia" WHERE "productReviewMediaId" = $1 RETURNING "productReviewMediaId"`,
      [productReviewMediaId],
    );
    return !!result;
  }
}

export default new ProductReviewMediaRepo();
