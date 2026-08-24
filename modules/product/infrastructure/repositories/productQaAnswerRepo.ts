import { query, queryOne } from '../../../../libs/db';
import { FailedToCreateProductError } from '../../domain/errors/ProductErrors';

export type ProductQaAnswerStatus = 'pending' | 'approved' | 'rejected';

export interface ProductQaAnswer {
  productQaAnswerId: string;
  createdAt: string;
  updatedAt: string;
  productQaId: string;
  customerId?: string | null;
  organizationId?: string | null;
  answer: string;
  status: ProductQaAnswerStatus;
  isOfficial: boolean;
}

export type ProductQaAnswerCreateParams = Omit<ProductQaAnswer, 'productQaAnswerId' | 'createdAt' | 'updatedAt'>;

export class ProductQaAnswerRepo {
  async findByQuestion(productQaId: string, status?: ProductQaAnswerStatus): Promise<ProductQaAnswer[]> {
    let sql = `SELECT * FROM "productQaAnswer" WHERE "productQaId" = $1`;
    const params: unknown[] = [productQaId];

    if (status) {
      sql += ` AND "status" = $2`;
      params.push(status);
    }

    sql += ` ORDER BY "isOfficial" DESC, "createdAt" ASC`;
    return (await query<ProductQaAnswer[]>(sql, params)) || [];
  }

  async create(params: ProductQaAnswerCreateParams): Promise<ProductQaAnswer> {
    const now = new Date();
    const result = await queryOne<ProductQaAnswer>(
      `INSERT INTO "productQaAnswer" ("productQaId", "customerId", "organizationId", "answer", "status", "isOfficial", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        params.productQaId,
        params.customerId || null,
        params.organizationId || null,
        params.answer,
        params.status || 'pending',
        params.isOfficial ?? false,
        now,
        now,
      ],
    );
    if (!result) throw new FailedToCreateProductError();
    return result;
  }

  async updateStatus(productQaAnswerId: string, status: ProductQaAnswerStatus): Promise<ProductQaAnswer | null> {
    return queryOne<ProductQaAnswer>(
      `UPDATE "productQaAnswer" SET "status" = $1, "updatedAt" = $2 WHERE "productQaAnswerId" = $3 RETURNING *`,
      [status, new Date(), productQaAnswerId],
    );
  }
}

export default new ProductQaAnswerRepo();
