import { query, queryOne } from '../../../../libs/db';
import { FailedToCreateProductError } from '../../domain/errors/ProductErrors';

import type { ProductQaAnswerStatus, ProductQaAnswer } from '../../domain/repositories/ProductCatalogPorts';
export type { ProductQaAnswerStatus, ProductQaAnswer } from '../../domain/repositories/ProductCatalogPorts';
export type ProductQaAnswerCreateParams = Omit<ProductQaAnswer, 'productQaAnswerId' | 'createdAt' | 'updatedAt'>;

export class ProductQaAnswerRepo {
  async findByQuestion(productQaId: string, status?: ProductQaAnswerStatus): Promise<ProductQaAnswer[]> {
    let sql = `SELECT * FROM "productQaAnswer" WHERE "questionId" = $1`;
    const params: unknown[] = [productQaId];

    if (status) {
      sql += ` AND "status" = $2`;
      params.push(status);
    }

    sql += ` ORDER BY "isVerified" DESC, "createdAt" ASC`;
    return (await query<ProductQaAnswer[]>(sql, params)) || [];
  }

  async create(params: ProductQaAnswerCreateParams): Promise<ProductQaAnswer> {
    const now = new Date();
    const result = await queryOne<ProductQaAnswer>(
      `INSERT INTO "productQaAnswer" ("questionId", "customerId", "answer", "status", "isVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [params.productQaId, params.customerId || null, params.answer, params.status || 'pending', params.isOfficial ?? false, now, now],
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
