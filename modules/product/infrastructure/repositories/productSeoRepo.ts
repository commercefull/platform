import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';
import { ProductValidationError, FailedToCreateProductError } from '../../domain/errors/ProductErrors';
import type { ProductSeo as DbProductSeo } from '../../../../libs/db/types';

export type ProductSeo = DbProductSeo;

export type ProductSeoCreateParams = Omit<ProductSeo, 'productSeoId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type ProductSeoUpdateParams = Partial<Omit<ProductSeo, 'productSeoId' | 'productId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

function seoInsertValues(params: ProductSeoCreateParams, now: string): unknown[] {
  const n = (value: unknown, fallback: unknown = null): unknown => value || fallback;
  return [
    params.productId,
    n(params.metaTitle),
    n(params.metaDescription),
    n(params.metaKeywords),
    n(params.ogTitle),
    n(params.ogDescription),
    n(params.ogImage),
    params.twitterCard || 'summary_large_image',
    n(params.twitterTitle),
    n(params.twitterDescription),
    n(params.twitterImage),
    n(params.canonicalUrl),
    params.robots || 'index, follow',
    params.structuredData ? JSON.stringify(params.structuredData) : null,
    now,
    now,
  ];
}

class ProductSeoRepo {
  async findById(id: string): Promise<ProductSeo | null> {
    return await queryOne<DbProductSeo>(`SELECT * FROM "productSeo" WHERE "productSeoId" = $1 AND "deletedAt" IS NULL`, [id]);
  }

  async findByProductId(productId: string): Promise<ProductSeo | null> {
    return await queryOne<DbProductSeo>(`SELECT * FROM "productSeo" WHERE "productId" = $1 AND "deletedAt" IS NULL`, [productId]);
  }

  async findAll(limit = 100, offset = 0): Promise<ProductSeo[]> {
    return (
      (await query<DbProductSeo[]>(`SELECT * FROM "productSeo" WHERE "deletedAt" IS NULL ORDER BY "updatedAt" DESC LIMIT $1 OFFSET $2`, [
        limit,
        offset,
      ])) || []
    );
  }

  async create(params: ProductSeoCreateParams): Promise<ProductSeo> {
    const now = unixTimestamp();

    // Check if SEO already exists for product
    const existing = await this.findByProductId(params.productId);
    if (existing) throw new ProductValidationError('SEO already exists for this product');

    const result = await queryOne<DbProductSeo>(
      `INSERT INTO "productSeo" (
        "productId", "metaTitle", "metaDescription", "metaKeywords", "ogTitle", "ogDescription",
        "ogImage", "twitterCard", "twitterTitle", "twitterDescription", "twitterImage",
        "canonicalUrl", "robots", "structuredData", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      seoInsertValues(params, now),
    );

    if (!result) throw new FailedToCreateProductError();
    return result;
  }

  async upsert(params: ProductSeoCreateParams): Promise<ProductSeo> {
    const existing = await this.findByProductId(params.productId);
    if (existing) {
      const { productId: _productId, ...updateData } = params;
      const updated = await this.update(existing.productSeoId, updateData as ProductSeoUpdateParams);
      if (!updated) throw new ProductValidationError('Failed to update SEO');
      return updated;
    }
    return this.create(params);
  }

  async update(id: string, params: ProductSeoUpdateParams): Promise<ProductSeo | null> {
    const updateFields: string[] = [];
    const values: unknown[] = [];
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

    return await queryOne<DbProductSeo>(
      `UPDATE "productSeo" SET ${updateFields.join(', ')} WHERE "productSeoId" = $${paramIndex} AND "deletedAt" IS NULL RETURNING *`,
      values,
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ productSeoId: string }>(
      `UPDATE "productSeo" SET "deletedAt" = $1 WHERE "productSeoId" = $2 AND "deletedAt" IS NULL RETURNING "productSeoId"`,
      [unixTimestamp(), id],
    );
    return !!result;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await queryOne<{ productSeoId: string }>(`DELETE FROM "productSeo" WHERE "productSeoId" = $1 RETURNING "productSeoId"`, [
      id,
    ]);
    return !!result;
  }

  async count(): Promise<number> {
    const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "productSeo" WHERE "deletedAt" IS NULL`);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new ProductSeoRepo();
