import { query, queryOne } from '../../../../libs/db';

export interface ProductList {
  productListId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  merchantId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export type ProductListCreateParams = Omit<ProductList, 'productListId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type ProductListUpdateParams = Partial<Omit<ProductListCreateParams, 'merchantId'>>;

export class ProductListRepo {
  async findByMerchant(merchantId: string): Promise<ProductList[]> {
    return (
      (await query<ProductList[]>(
        `SELECT * FROM "productList" WHERE "merchantId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC`,
        [merchantId],
      )) || []
    );
  }

  async findById(productListId: string): Promise<ProductList | null> {
    return queryOne<ProductList>(
      `SELECT * FROM "productList" WHERE "productListId" = $1 AND "deletedAt" IS NULL`,
      [productListId],
    );
  }

  async create(params: ProductListCreateParams): Promise<ProductList> {
    const now = new Date();
    const result = await queryOne<ProductList>(
      `INSERT INTO "productList" ("merchantId", "name", "description", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [params.merchantId, params.name, params.description || null, params.isActive ?? true, now, now],
    );
    if (!result) throw new Error('Failed to create productList');
    return result;
  }

  async update(productListId: string, params: ProductListUpdateParams): Promise<ProductList | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        fields.push(`"${key}" = $${i++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return this.findById(productListId);

    fields.push(`"updatedAt" = $${i++}`);
    values.push(new Date(), productListId);

    return queryOne<ProductList>(
      `UPDATE "productList" SET ${fields.join(', ')} WHERE "productListId" = $${i} AND "deletedAt" IS NULL RETURNING *`,
      values,
    );
  }

  async softDelete(productListId: string): Promise<boolean> {
    const result = await queryOne<{ productListId: string }>(
      `UPDATE "productList" SET "deletedAt" = $1 WHERE "productListId" = $2 AND "deletedAt" IS NULL RETURNING "productListId"`,
      [new Date(), productListId],
    );
    return !!result;
  }
}

export default new ProductListRepo();
