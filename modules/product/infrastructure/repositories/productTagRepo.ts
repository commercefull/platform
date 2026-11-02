import { query, queryOne } from '../../../../libs/db';
import { FailedToCreateProductError } from '../../domain/errors/ProductErrors';

import type { ProductTag, ProductTagCreateParams } from '../../domain/repositories/ProductCatalogPorts';
import type { ProductTag as DbProductTag } from '../../../../libs/db/types';
export type { ProductTag, ProductTagCreateParams } from '../../domain/repositories/ProductCatalogPorts';

class ProductTagRepo {
  async findAll(includeDeleted = false): Promise<ProductTag[]> {
    const sql = includeDeleted ? `SELECT * FROM "productTag" ORDER BY "name" ASC` : `SELECT * FROM "productTag" ORDER BY "name" ASC`;
    return (await query<DbProductTag[]>(sql)) || [];
  }

  async findById(productTagId: string): Promise<ProductTag | null> {
    return queryOne<DbProductTag>(`SELECT * FROM "productTag" WHERE "productTagId" = $1`, [productTagId]);
  }

  async create(params: ProductTagCreateParams): Promise<ProductTag> {
    const now = new Date();
    const result = await queryOne<DbProductTag>(
      `INSERT INTO "productTag" ("name", "slug", "description", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [params.name, params.slug, params.description || null, now, now],
    );
    if (!result) throw new FailedToCreateProductError();
    return result;
  }

  async softDelete(productTagId: string): Promise<boolean> {
    const result = await queryOne<{ productTagId: string }>(`DELETE FROM "productTag" WHERE "productTagId" = $1 RETURNING "productTagId"`, [
      new Date(),
      productTagId,
    ]);
    return !!result;
  }
}

export default new ProductTagRepo();
