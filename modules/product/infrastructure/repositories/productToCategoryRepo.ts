import { query, queryOne } from '../../../../libs/db';

export interface ProductToCategory {
  productToCategoryId: string;
  createdAt: string;
  productId: string;
  productCategoryId: string;
  position: number;
  isPrimary: boolean;
}

export type ProductToCategoryCreateParams = Omit<ProductToCategory, 'productToCategoryId' | 'createdAt'>;

export class ProductToCategoryRepo {
  async findByProduct(productId: string): Promise<ProductToCategory[]> {
    return (
      (await query<ProductToCategory[]>(
        `SELECT * FROM "productToCategory" WHERE "productId" = $1 ORDER BY "isPrimary" DESC, "position" ASC`,
        [productId],
      )) || []
    );
  }

  async findByCategory(productCategoryId: string): Promise<ProductToCategory[]> {
    return (
      (await query<ProductToCategory[]>(
        `SELECT * FROM "productToCategory" WHERE "productCategoryId" = $1 ORDER BY "position" ASC`,
        [productCategoryId],
      )) || []
    );
  }

  async create(params: ProductToCategoryCreateParams): Promise<ProductToCategory> {
    const now = new Date();
    const result = await queryOne<ProductToCategory>(
      `INSERT INTO "productToCategory" ("productId", "productCategoryId", "position", "isPrimary", "createdAt")
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [params.productId, params.productCategoryId, params.position ?? 0, params.isPrimary ?? false, now],
    );
    if (!result) throw new Error('Failed to create productToCategory');
    return result;
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
