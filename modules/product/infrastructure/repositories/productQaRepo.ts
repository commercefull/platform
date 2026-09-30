import { query, queryOne } from '../../../../libs/db';
import { FailedToCreateProductError } from '../../domain/errors/ProductErrors';

import type { ProductQaStatus, ProductQa, ProductQaCreateParams } from '../../domain/repositories/ProductCatalogPorts';
export type { ProductQaStatus, ProductQa, ProductQaCreateParams } from '../../domain/repositories/ProductCatalogPorts';

export class ProductQaRepo {
  async findByProduct(productId: string, status?: ProductQaStatus): Promise<ProductQa[]> {
    let sql = `SELECT * FROM "productQa" WHERE "productId" = $1`;
    const params: unknown[] = [productId];

    if (status) {
      sql += ` AND "status" = $2`;
      params.push(status);
    }

    sql += ` ORDER BY "createdAt" DESC`;
    return (await query<ProductQa[]>(sql, params)) || [];
  }

  async findById(productQaId: string): Promise<ProductQa | null> {
    return queryOne<ProductQa>(`SELECT * FROM "productQa" WHERE "productQaId" = $1`, [productQaId]);
  }

  async create(params: ProductQaCreateParams): Promise<ProductQa> {
    const now = new Date();
    const result = await queryOne<ProductQa>(
      `INSERT INTO "productQa" ("productId", "customerId", "question", "status", "askerName", "askerEmail", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        params.productId,
        params.customerId || null,
        params.question,
        params.status || 'pending',
        params.askerName || null,
        params.askerEmail || null,
        now,
        now,
      ],
    );
    if (!result) throw new FailedToCreateProductError();
    return result;
  }

  async updateStatus(productQaId: string, status: ProductQaStatus): Promise<ProductQa | null> {
    return queryOne<ProductQa>(`UPDATE "productQa" SET "status" = $1, "updatedAt" = $2 WHERE "productQaId" = $3 RETURNING *`, [
      status,
      new Date(),
      productQaId,
    ]);
  }
}

export default new ProductQaRepo();
