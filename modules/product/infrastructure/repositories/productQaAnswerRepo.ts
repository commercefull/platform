import { query, queryOne } from '../../../../libs/db';
import { FailedToCreateProductError } from '../../domain/errors/ProductErrors';

import type { ProductQaAnswerStatus, ProductQaAnswer } from '../../domain/repositories/ProductCatalogPorts';
import type { ProductQaAnswer as DbProductQaAnswer } from '../../../../libs/db/types';
type ProductQaAnswerCreateParams = Omit<ProductQaAnswer, 'productQaAnswerId' | 'createdAt' | 'updatedAt'>;

class ProductQaAnswerRepo {
  async findByQuestion(productQaId: string, status?: ProductQaAnswerStatus): Promise<ProductQaAnswer[]> {
    let sql = `SELECT * FROM "productQaAnswer" WHERE "questionId" = $1`;
    const params: unknown[] = [productQaId];

    if (status) {
      sql += ` AND "status" = $2`;
      params.push(status);
    }

    sql += ` ORDER BY "isVerified" DESC, "createdAt" ASC`;
    return (await query<DbProductQaAnswer[]>(sql, params)) || [];
  }

  async create(params: ProductQaAnswerCreateParams): Promise<ProductQaAnswer> {
    const now = new Date();
    const result = await queryOne<DbProductQaAnswer>(
      `INSERT INTO "productQaAnswer" ("questionId", "customerId", "answer", "status", "isVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [params.questionId, params.customerId || null, params.answer, params.status || 'pending', params.isVerified ?? false, now, now],
    );
    if (!result) throw new FailedToCreateProductError();
    return result;
  }

  async updateStatus(productQaAnswerId: string, status: ProductQaAnswerStatus): Promise<ProductQaAnswer | null> {
    return queryOne<DbProductQaAnswer>(
      `UPDATE "productQaAnswer" SET "status" = $1, "updatedAt" = $2 WHERE "productQaAnswerId" = $3 RETURNING *`,
      [status, new Date(), productQaAnswerId],
    );
  }
}

export default new ProductQaAnswerRepo();
