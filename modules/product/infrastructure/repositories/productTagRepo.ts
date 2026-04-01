import { query, queryOne } from '../../../../libs/db';

export interface ProductTag {
  productTagId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  name: string;
  slug: string;
  description?: string | null;
}

export type ProductTagCreateParams = Omit<ProductTag, 'productTagId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export class ProductTagRepo {
  async findAll(includeDeleted = false): Promise<ProductTag[]> {
    const sql = includeDeleted
      ? `SELECT * FROM "productTag" ORDER BY "name" ASC`
      : `SELECT * FROM "productTag" WHERE "deletedAt" IS NULL ORDER BY "name" ASC`;
    return (await query<ProductTag[]>(sql)) || [];
  }

  async findById(productTagId: string): Promise<ProductTag | null> {
    return queryOne<ProductTag>(
      `SELECT * FROM "productTag" WHERE "productTagId" = $1 AND "deletedAt" IS NULL`,
      [productTagId],
    );
  }

  async create(params: ProductTagCreateParams): Promise<ProductTag> {
    const now = new Date();
    const result = await queryOne<ProductTag>(
      `INSERT INTO "productTag" ("name", "slug", "description", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [params.name, params.slug, params.description || null, now, now],
    );
    if (!result) throw new Error('Failed to create productTag');
    return result;
  }

  async softDelete(productTagId: string): Promise<boolean> {
    const result = await queryOne<{ productTagId: string }>(
      `UPDATE "productTag" SET "deletedAt" = $1 WHERE "productTagId" = $2 AND "deletedAt" IS NULL RETURNING "productTagId"`,
      [new Date(), productTagId],
    );
    return !!result;
  }
}

export default new ProductTagRepo();
