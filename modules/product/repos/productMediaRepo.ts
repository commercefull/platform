import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type MediaType = 'image' | 'video' | 'document' | '3d_model' | 'audio';

export interface ProductMedia {
  productMediaId: string;
  createdAt: string;
  updatedAt: string;
  productId: string;
  productVariantId?: string;
  type: MediaType;
  url: string;
  filename?: string;
  filesize?: number;
  mimeType?: string;
  altText?: string;
  title?: string;
  sortOrder: number;
  isPrimary: boolean;
  width?: number;
  height?: number;
  duration?: number;
}

export type ProductMediaCreateParams = Omit<ProductMedia, 'productMediaId' | 'createdAt' | 'updatedAt'>;
export type ProductMediaUpdateParams = Partial<
  Pick<ProductMedia, 'url' | 'filename' | 'altText' | 'title' | 'sortOrder' | 'isPrimary' | 'width' | 'height' | 'duration'>
>;

export class ProductMediaRepo {
  /**
   * Find media by ID
   */
  async findById(productMediaId: string): Promise<ProductMedia | null> {
    return await queryOne<ProductMedia>(`SELECT * FROM "public"."productMedia" WHERE "productMediaId" = $1`, [productMediaId]);
  }

  /**
   * Find all media for a product
   */
  async findByProductId(productId: string, type?: MediaType): Promise<ProductMedia[]> {
    let sql = `SELECT * FROM "public"."productMedia" WHERE "productId" = $1`;
    const params: any[] = [productId];

    if (type) {
      sql += ` AND "type" = $2`;
      params.push(type);
    }

    sql += ` ORDER BY "sortOrder" ASC, "createdAt" ASC`;

    const results = await query<ProductMedia[]>(sql, params);
    return results || [];
  }

  /**
   * Find all media for a product variant
   */
  async findByVariantId(productVariantId: string, type?: MediaType): Promise<ProductMedia[]> {
    let sql = `SELECT * FROM "public"."productMedia" WHERE "productVariantId" = $1`;
    const params: any[] = [productVariantId];

    if (type) {
      sql += ` AND "type" = $2`;
      params.push(type);
    }

    sql += ` ORDER BY "sortOrder" ASC, "createdAt" ASC`;

    const results = await query<ProductMedia[]>(sql, params);
    return results || [];
  }

  /**
   * Find primary media for product
   */
  async findPrimaryByProductId(productId: string): Promise<ProductMedia | null> {
    return await queryOne<ProductMedia>(
      `SELECT * FROM "public"."productMedia" 
       WHERE "productId" = $1 AND "isPrimary" = true AND "productVariantId" IS NULL`,
      [productId],
    );
  }

  /**
   * Find primary media for variant
   */
  async findPrimaryByVariantId(productVariantId: string): Promise<ProductMedia | null> {
    return await queryOne<ProductMedia>(
      `SELECT * FROM "public"."productMedia" 
       WHERE "productVariantId" = $1 AND "isPrimary" = true`,
      [productVariantId],
    );
  }

  /**
   * Find media by type
   */
  async findByType(type: MediaType, limit: number = 50, offset: number = 0): Promise<ProductMedia[]> {
    const results = await query<ProductMedia[]>(
      `SELECT * FROM "public"."productMedia" 
       WHERE "type" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT $2 OFFSET $3`,
      [type, limit, offset],
    );
    return results || [];
  }

  /**
   * Create product media
   */
  async create(params: ProductMediaCreateParams): Promise<ProductMedia> {
    const now = unixTimestamp();

    // If setting as primary, unset other primary media first
    if (params.isPrimary) {
      if (params.productVariantId) {
        await this.unsetPrimaryForVariant(params.productVariantId);
      } else {
        await this.unsetPrimaryForProduct(params.productId);
      }
    }

    const result = await queryOne<ProductMedia>(
      `INSERT INTO "public"."productMedia" (
        "productId", "productVariantId", "type", "url", "filename",
        "filesize", "mimeType", "altText", "title", "sortOrder",
        "isPrimary", "width", "height", "duration",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        params.productId,
        params.productVariantId || null,
        params.type,
        params.url,
        params.filename || null,
        params.filesize || null,
        params.mimeType || null,
        params.altText || null,
        params.title || null,
        params.sortOrder || 0,
        params.isPrimary || false,
        params.width || null,
        params.height || null,
        params.duration || null,
        now,
        now,
      ],
    );

    if (!result) {
      throw new Error('Failed to create product media');
    }

    return result;
  }

  /**
   * Update product media
   */
  async update(productMediaId: string, params: ProductMediaUpdateParams): Promise<ProductMedia | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // If setting as primary, need to unset others first
    if (params.isPrimary === true) {
      const media = await this.findById(productMediaId);
      if (media) {
        if (media.productVariantId) {
          await this.unsetPrimaryForVariant(media.productVariantId, productMediaId);
        } else {
          await this.unsetPrimaryForProduct(media.productId, productMediaId);
        }
      }
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(productMediaId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(productMediaId);

    const result = await queryOne<ProductMedia>(
      `UPDATE "public"."productMedia" 
       SET ${updateFields.join(', ')}
       WHERE "productMediaId" = $${paramIndex}
       RETURNING *`,
      values,
    );

    return result;
  }

  /**
   * Set media as primary
   */
  async setPrimary(productMediaId: string): Promise<ProductMedia | null> {
    return this.update(productMediaId, { isPrimary: true });
  }

  /**
   * Unset primary for product (except specified media)
   */
  private async unsetPrimaryForProduct(productId: string, exceptId?: string): Promise<void> {
    let sql = `UPDATE "public"."productMedia" 
               SET "isPrimary" = false, "updatedAt" = $1
               WHERE "productId" = $2 AND "productVariantId" IS NULL AND "isPrimary" = true`;
    const params: any[] = [unixTimestamp(), productId];

    if (exceptId) {
      sql += ` AND "productMediaId" != $3`;
      params.push(exceptId);
    }

    await query(sql, params);
  }

  /**
   * Unset primary for variant (except specified media)
   */
  private async unsetPrimaryForVariant(productVariantId: string, exceptId?: string): Promise<void> {
    let sql = `UPDATE "public"."productMedia" 
               SET "isPrimary" = false, "updatedAt" = $1
               WHERE "productVariantId" = $2 AND "isPrimary" = true`;
    const params: any[] = [unixTimestamp(), productVariantId];

    if (exceptId) {
      sql += ` AND "productMediaId" != $3`;
      params.push(exceptId);
    }

    await query(sql, params);
  }

  /**
   * Reorder media
   */
  async reorder(productMediaId: string, newSortOrder: number): Promise<ProductMedia | null> {
    return this.update(productMediaId, { sortOrder: newSortOrder });
  }

  /**
   * Bulk reorder media
   */
  async bulkReorder(updates: Array<{ productMediaId: string; sortOrder: number }>): Promise<boolean> {
    const now = unixTimestamp();

    for (const update of updates) {
      await query(
        `UPDATE "public"."productMedia" 
         SET "sortOrder" = $1, "updatedAt" = $2 
         WHERE "productMediaId" = $3`,
        [update.sortOrder, now, update.productMediaId],
      );
    }

    return true;
  }

  /**
   * Delete media
   */
  async delete(productMediaId: string): Promise<boolean> {
    const result = await queryOne<{ productMediaId: string }>(
      `DELETE FROM "public"."productMedia" WHERE "productMediaId" = $1 RETURNING "productMediaId"`,
      [productMediaId],
    );

    return !!result;
  }

  /**
   * Delete all media for product
   */
  async deleteByProductId(productId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `DELETE FROM "public"."productMedia" WHERE "productId" = $1 RETURNING COUNT(*) as count`,
      [productId],
    );

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Delete all media for variant
   */
  async deleteByVariantId(productVariantId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `DELETE FROM "public"."productMedia" WHERE "productVariantId" = $1 RETURNING COUNT(*) as count`,
      [productVariantId],
    );

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Count media by product
   */
  async countByProductId(productId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "public"."productMedia" WHERE "productId" = $1`, [
      productId,
    ]);

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Count media by type
   */
  async countByType(type: MediaType): Promise<number> {
    const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "public"."productMedia" WHERE "type" = $1`, [type]);

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Get media statistics
   */
  async getStatistics(): Promise<Record<MediaType, number>> {
    const results = await query<{ type: MediaType; count: string }[]>(
      `SELECT "type", COUNT(*) as count FROM "public"."productMedia" GROUP BY "type"`,
      [],
    );

    const stats: Record<string, number> = {
      image: 0,
      video: 0,
      document: 0,
      '3d_model': 0,
      audio: 0,
    };

    if (results) {
      results.forEach(row => {
        stats[row.type] = parseInt(row.count, 10);
      });
    }

    return stats as Record<MediaType, number>;
  }

  /**
   * Get total storage size
   */
  async getTotalStorageSize(): Promise<number> {
    const result = await queryOne<{ total: string }>(`SELECT COALESCE(SUM("filesize"), 0) as total FROM "public"."productMedia"`, []);

    return result ? parseInt(result.total, 10) : 0;
  }
}

export default new ProductMediaRepo();
