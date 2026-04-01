import { query, queryOne } from '../../../../libs/db';

export interface ProductListItem {
  productListItemId: string;
  createdAt: string;
  updatedAt: string;
  productListId: string;
  productId: string;
  position: number;
}

export type ProductListItemCreateParams = Omit<ProductListItem, 'productListItemId' | 'createdAt' | 'updatedAt'>;

export class ProductListItemRepo {
  async findByList(productListId: string): Promise<ProductListItem[]> {
    return (
      (await query<ProductListItem[]>(
        `SELECT * FROM "productListItem" WHERE "productListId" = $1 ORDER BY "position" ASC, "createdAt" ASC`,
        [productListId],
      )) || []
    );
  }

  async create(params: ProductListItemCreateParams): Promise<ProductListItem> {
    const now = new Date();
    const result = await queryOne<ProductListItem>(
      `INSERT INTO "productListItem" ("productListId", "productId", "position", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [params.productListId, params.productId, params.position ?? 0, now, now],
    );
    if (!result) throw new Error('Failed to create productListItem');
    return result;
  }

  async delete(productListItemId: string): Promise<boolean> {
    const result = await queryOne<{ productListItemId: string }>(
      `DELETE FROM "productListItem" WHERE "productListItemId" = $1 RETURNING "productListItemId"`,
      [productListItemId],
    );
    return !!result;
  }
}

export default new ProductListItemRepo();
