import { query, queryOne } from '../../../../libs/db';

export interface ProductCollection {
  productCollectionId: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  merchantId?: string | null;
}

export type ProductCollectionCreateParams = Omit<ProductCollection, 'productCollectionId' | 'createdAt' | 'updatedAt'>;
export type ProductCollectionUpdateParams = Partial<Omit<ProductCollectionCreateParams, never>>;

export class ProductCollectionRepo {
  async findAll(): Promise<ProductCollection[]> {
    const sql = `SELECT * FROM "productCollection" ORDER BY "name" ASC`;
    return (await query<ProductCollection[]>(sql)) || [];
  }

  async findById(productCollectionId: string): Promise<ProductCollection | null> {
    return queryOne<ProductCollection>(`SELECT * FROM "productCollection" WHERE "productCollectionId" = $1`, [
      productCollectionId,
    ]);
  }

  async create(params: ProductCollectionCreateParams): Promise<ProductCollection> {
    const now = new Date();
    const result = await queryOne<ProductCollection>(
      `INSERT INTO "productCollection" ("name", "slug", "description", "imageUrl", "isActive", "merchantId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        params.name,
        params.slug,
        params.description || null,
        params.imageUrl || null,
        params.isActive ?? true,
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
    const values: unknown[] = [];
    let i = 1;

    // Skip fields that don't exist in the DB schema
    const skipFields = ['position', 'deletedAt'];

    for (const [key, value] of Object.entries(params)) {
      if (skipFields.includes(key)) continue;
      if (value !== undefined) {
        fields.push(`"${key}" = $${i++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return this.findById(productCollectionId);

    fields.push(`"updatedAt" = $${i++}`);
    values.push(new Date());
    values.push(productCollectionId);

    return queryOne<ProductCollection>(
      `UPDATE "productCollection" SET ${fields.join(', ')} WHERE "productCollectionId" = $${i} RETURNING *`,
      values,
    );
  }

  async softDelete(productCollectionId: string): Promise<boolean> {
    // No deletedAt column in schema — use hard delete
    const result = await queryOne<{ productCollectionId: string }>(
      `DELETE FROM "productCollection" WHERE "productCollectionId" = $1 RETURNING "productCollectionId"`,
      [productCollectionId],
    );
    return !!result;
  }
}

export default new ProductCollectionRepo();
