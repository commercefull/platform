import { query, queryOne } from '../../../../libs/db';

export interface ProductCategory {
  productCategoryId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  position: number;
  isActive: boolean;
  imageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export type ProductCategoryCreateParams = Omit<ProductCategory, 'productCategoryId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type ProductCategoryUpdateParams = Partial<Omit<ProductCategoryCreateParams, never>>;

export class ProductCategoryRepo {
  async findAll(includeDeleted = false): Promise<ProductCategory[]> {
    const sql = includeDeleted
      ? `SELECT * FROM "productCategory" ORDER BY "position" ASC, "name" ASC`
      : `SELECT * FROM "productCategory" WHERE "deletedAt" IS NULL ORDER BY "position" ASC, "name" ASC`;
    return (await query<ProductCategory[]>(sql)) || [];
  }

  async findById(productCategoryId: string): Promise<ProductCategory | null> {
    return queryOne<ProductCategory>(
      `SELECT * FROM "productCategory" WHERE "productCategoryId" = $1 AND "deletedAt" IS NULL`,
      [productCategoryId],
    );
  }

  async findBySlug(slug: string): Promise<ProductCategory | null> {
    return queryOne<ProductCategory>(
      `SELECT * FROM "productCategory" WHERE "slug" = $1 AND "deletedAt" IS NULL`,
      [slug],
    );
  }

  async create(params: ProductCategoryCreateParams): Promise<ProductCategory> {
    const now = new Date();
    const result = await queryOne<ProductCategory>(
      `INSERT INTO "productCategory" ("name", "slug", "description", "parentId", "position", "isActive", "imageUrl", "metaTitle", "metaDescription", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        params.name,
        params.slug,
        params.description || null,
        params.parentId || null,
        params.position ?? 0,
        params.isActive ?? true,
        params.imageUrl || null,
        params.metaTitle || null,
        params.metaDescription || null,
        now,
        now,
      ],
    );
    if (!result) throw new Error('Failed to create productCategory');
    return result;
  }

  async update(productCategoryId: string, params: ProductCategoryUpdateParams): Promise<ProductCategory | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        fields.push(`"${key}" = $${i++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return this.findById(productCategoryId);

    fields.push(`"updatedAt" = $${i++}`);
    values.push(new Date(), productCategoryId);

    return queryOne<ProductCategory>(
      `UPDATE "productCategory" SET ${fields.join(', ')} WHERE "productCategoryId" = $${i} AND "deletedAt" IS NULL RETURNING *`,
      values,
    );
  }

  async softDelete(productCategoryId: string): Promise<boolean> {
    const result = await queryOne<{ productCategoryId: string }>(
      `UPDATE "productCategory" SET "deletedAt" = $1 WHERE "productCategoryId" = $2 AND "deletedAt" IS NULL RETURNING "productCategoryId"`,
      [new Date(), productCategoryId],
    );
    return !!result;
  }
}

export default new ProductCategoryRepo();
