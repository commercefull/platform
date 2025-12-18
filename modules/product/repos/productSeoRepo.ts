import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export interface ProductSeo {
  productSeoId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  productId: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  robots: string;
  structuredData?: Record<string, any>;
}

export type ProductSeoCreateParams = Omit<ProductSeo, 'productSeoId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type ProductSeoUpdateParams = Partial<Omit<ProductSeo, 'productSeoId' | 'productId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export class ProductSeoRepo {
  async findById(id: string): Promise<ProductSeo | null> {
    return await queryOne<ProductSeo>(`SELECT * FROM "productSeo" WHERE "productSeoId" = $1 AND "deletedAt" IS NULL`, [id]);
  }

  async findByProductId(productId: string): Promise<ProductSeo | null> {
    return await queryOne<ProductSeo>(`SELECT * FROM "productSeo" WHERE "productId" = $1 AND "deletedAt" IS NULL`, [productId]);
  }

  async findAll(limit = 100, offset = 0): Promise<ProductSeo[]> {
    return (await query<ProductSeo[]>(
      `SELECT * FROM "productSeo" WHERE "deletedAt" IS NULL ORDER BY "updatedAt" DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    )) || [];
  }

  async create(params: ProductSeoCreateParams): Promise<ProductSeo> {
    const now = unixTimestamp();

    // Check if SEO already exists for product
    const existing = await this.findByProductId(params.productId);
    if (existing) throw new Error('SEO already exists for this product');

    const result = await queryOne<ProductSeo>(
      `INSERT INTO "productSeo" (
        "productId", "metaTitle", "metaDescription", "metaKeywords", "ogTitle", "ogDescription",
        "ogImage", "twitterCard", "twitterTitle", "twitterDescription", "twitterImage",
        "canonicalUrl", "robots", "structuredData", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [
        params.productId, params.metaTitle || null, params.metaDescription || null,
        params.metaKeywords || null, params.ogTitle || null, params.ogDescription || null,
        params.ogImage || null, params.twitterCard || 'summary_large_image',
        params.twitterTitle || null, params.twitterDescription || null, params.twitterImage || null,
        params.canonicalUrl || null, params.robots || 'index, follow',
        params.structuredData ? JSON.stringify(params.structuredData) : null, now, now
      ]
    );

    if (!result) throw new Error('Failed to create product SEO');
    return result;
  }

  async upsert(params: ProductSeoCreateParams): Promise<ProductSeo> {
    const existing = await this.findByProductId(params.productId);
    if (existing) {
      const { productId, ...updateData } = params;
      const updated = await this.update(existing.productSeoId, updateData as ProductSeoUpdateParams);
      if (!updated) throw new Error('Failed to update SEO');
      return updated;
    }
    return this.create(params);
  }

  async update(id: string, params: ProductSeoUpdateParams): Promise<ProductSeo | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(key === 'structuredData' && value ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<ProductSeo>(
      `UPDATE "productSeo" SET ${updateFields.join(', ')} WHERE "productSeoId" = $${paramIndex} AND "deletedAt" IS NULL RETURNING *`,
      values
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ productSeoId: string }>(
      `UPDATE "productSeo" SET "deletedAt" = $1 WHERE "productSeoId" = $2 AND "deletedAt" IS NULL RETURNING "productSeoId"`,
      [unixTimestamp(), id]
    );
    return !!result;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await queryOne<{ productSeoId: string }>(
      `DELETE FROM "productSeo" WHERE "productSeoId" = $1 RETURNING "productSeoId"`,
      [id]
    );
    return !!result;
  }

  async count(): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "productSeo" WHERE "deletedAt" IS NULL`
    );
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new ProductSeoRepo();
