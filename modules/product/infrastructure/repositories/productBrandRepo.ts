import { query, queryOne } from '../../../../libs/db';

export interface ProductBrand {
  productBrandId: string;
  createdAt: string;
  updatedAt: string;
  productId: string;
  brandId: string;
}

export type ProductBrandCreateParams = Pick<ProductBrand, 'productId' | 'brandId'>;

export class ProductBrandRepo {
  async findByProduct(productId: string): Promise<ProductBrand[]> {
    return (await query<ProductBrand[]>(`SELECT * FROM "productBrand" WHERE "productId" = $1 ORDER BY "createdAt" ASC`, [productId])) || [];
  }

  async create(params: ProductBrandCreateParams): Promise<ProductBrand> {
    const now = new Date();
    const result = await queryOne<ProductBrand>(
      `INSERT INTO "productBrand" ("productId", "brandId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [params.productId, params.brandId, now, now],
    );
    if (!result) throw new Error('Failed to create productBrand');
    return result;
  }

  async delete(productBrandId: string): Promise<boolean> {
    const result = await queryOne<{ productBrandId: string }>(
      `DELETE FROM "productBrand" WHERE "productBrandId" = $1 RETURNING "productBrandId"`,
      [productBrandId],
    );
    return !!result;
  }
}

export default new ProductBrandRepo();
