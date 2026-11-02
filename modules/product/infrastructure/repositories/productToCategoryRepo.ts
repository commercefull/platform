import { query, queryOne } from '../../../../libs/db';
import { FailedToCreateProductError } from '../../domain/errors/ProductErrors';

import type { ProductToCategory } from '../../domain/repositories/ProductCatalogPorts';
import type { ProductToCategory as DbProductToCategory } from '../../../../libs/db/types';
export type { ProductToCategory } from '../../domain/repositories/ProductCatalogPorts';
export type ProductToCategoryCreateParams = Omit<ProductToCategory, 'productToCategoryId' | 'createdAt'>;

function rowToProductToCategory(row: DbProductToCategory): ProductToCategory {
  return { ...row, position: row.position ?? 0 };
}

class ProductToCategoryRepo {
  async findByProduct(productId: string): Promise<ProductToCategory[]> {
    return (
      (await query<DbProductToCategory[]>(
        `SELECT * FROM "productToCategory" WHERE "productId" = $1 ORDER BY "isPrimary" DESC, "position" ASC`,
        [productId],
      )) || []
    ).map(rowToProductToCategory);
  }

  async findByCategory(productCategoryId: string): Promise<ProductToCategory[]> {
    return (
      (await query<DbProductToCategory[]>(`SELECT * FROM "productToCategory" WHERE "productCategoryId" = $1 ORDER BY "position" ASC`, [
        productCategoryId,
      ])) || []
    ).map(rowToProductToCategory);
  }

  async create(params: ProductToCategoryCreateParams): Promise<ProductToCategory> {
    const now = new Date();
    const result = await queryOne<DbProductToCategory>(
      `INSERT INTO "productToCategory" ("productId", "productCategoryId", "position", "isPrimary", "createdAt")
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [params.productId, params.productCategoryId, params.position ?? 0, params.isPrimary ?? false, now],
    );
    if (!result) throw new FailedToCreateProductError();
    return rowToProductToCategory(result);
  }

  async delete(productToCategoryId: string): Promise<boolean> {
    const result = await queryOne<{ productToCategoryId: string }>(
      `DELETE FROM "productToCategory" WHERE "productToCategoryId" = $1 RETURNING "productToCategoryId"`,
      [productToCategoryId],
    );
    return !!result;
  }
}

export default new ProductToCategoryRepo();
