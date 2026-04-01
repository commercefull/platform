import { query, queryOne } from '../../../../libs/db';

export interface ProductCollection {
  productCollectionId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  position: number;
  merchantId?: string | null;
}

export type ProductCollectionCreateParams = Omit<ProductCollection, 'productCollectionId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type ProductCollectionUpdateParams = Partial<Omit<ProductCollectionCreateParams, never>>;

export class ProductCollectionRepo {
  async findAll(includeDeleted = false): Promise<ProductCollection[]> {
    const sql = includeDeleted
      ? `SELECT * FROM "productCollection" ORDER BY "position" ASC, "name" ASC`
      : `SELECT * FROM "productCollection" WHERE "deletedAt" IS NULL ORDER BY "position" ASC, "name" ASC`;
    return (await query<ProductCollection[]>(sql)) || [];
  }

  async findById(productCollectionId: string): Promise<ProductCollection | null> {
    return queryOne<ProductCollection>(
      `SELECT * FROM "productCollection" WHERE "productCollectionId" = $1 AND "deletedAt" IS NULL`,
      [productCollectionId],
    );
  }

  async create(params: ProductCollectionCreateParams): Promise<ProductCollection> {
    const now = new Date();
    const result = await queryOne<ProductCollection>(
      `INSERT INTO "productCollection" ("name", "slug", "description", "imageUrl", "isActive", "position", "merchantId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        params.name,
        params.slug,
        params.description || null,
        params.imageUrl || null,
        params.isActive ?? true,
        params.position ?? 0,
        params.merchantId || null,
        now,
        now,
      ],
    );
    if (!result) throw new Error('Failed to create productCollection');
    return result;
  }

  async update(productCollectionId: string, params: ProductCollectionUpdateParams): Promise<ProductCollection | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        fields.push(`"${key}" = $${i++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return this.findById(productCollectionId);

    fields.push(`"updatedAt" = $${i++}`);
    values.push(new Date(), productCollectionId);

    return queryOne<ProductCollection>(
      `UPDATE "productCollection" SET ${fields.join(', ')} WHERE "productCollectionId" = $${i} AND "deletedAt" IS NULL RETURNING *`,
      values,
    );
  }

  async softDelete(productCollectionId: string): Promise<boolean> {
    const result = await queryOne<{ productCollectionId: string }>(
      `UPDATE "productCollection" SET "deletedAt" = $1 WHERE "productCollectionId" = $2 AND "deletedAt" IS NULL RETURNING "productCollectionId"`,
      [new Date(), productCollectionId],
    );
    return !!result;
  }
}

export default new ProductCollectionRepo();
