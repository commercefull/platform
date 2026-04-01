import { query, queryOne } from '../../../../libs/db';

export interface ProductCollectionMap {
  productCollectionMapId: string;
  createdAt: string;
  productCollectionId: string;
  productId: string;
  position: number;
}

export type ProductCollectionMapCreateParams = Omit<ProductCollectionMap, 'productCollectionMapId' | 'createdAt'>;

export class ProductCollectionMapRepo {
  async findByCollection(productCollectionId: string): Promise<ProductCollectionMap[]> {
    return (
      (await query<ProductCollectionMap[]>(
        `SELECT * FROM "productCollectionMap" WHERE "productCollectionId" = $1 ORDER BY "position" ASC`,
        [productCollectionId],
      )) || []
    );
  }

  async create(params: ProductCollectionMapCreateParams): Promise<ProductCollectionMap> {
    const now = new Date();
    const result = await queryOne<ProductCollectionMap>(
      `INSERT INTO "productCollectionMap" ("productCollectionId", "productId", "position", "createdAt")
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [params.productCollectionId, params.productId, params.position ?? 0, now],
    );
    if (!result) throw new Error('Failed to create productCollectionMap');
    return result;
  }

  async delete(productCollectionMapId: string): Promise<boolean> {
    const result = await queryOne<{ productCollectionMapId: string }>(
      `DELETE FROM "productCollectionMap" WHERE "productCollectionMapId" = $1 RETURNING "productCollectionMapId"`,
      [productCollectionMapId],
    );
    return !!result;
  }
}

export default new ProductCollectionMapRepo();
