import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export interface ProductDownload {
  productDownloadId: string;
  createdAt: string;
  updatedAt: string;
  productId: string;
  productVariantId?: string;
  name: string;
  fileUrl: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  maxDownloads?: number;
  daysValid?: number;
  isActive: boolean;
  sampleUrl?: string;
  sortOrder: number;
}

export type ProductDownloadCreateParams = Omit<ProductDownload, 'productDownloadId' | 'createdAt' | 'updatedAt'>;
export type ProductDownloadUpdateParams = Partial<Omit<ProductDownload, 'productDownloadId' | 'productId' | 'createdAt' | 'updatedAt'>>;

export class ProductDownloadRepo {
  async findById(id: string): Promise<ProductDownload | null> {
    return await queryOne<ProductDownload>(`SELECT * FROM "productDownload" WHERE "productDownloadId" = $1`, [id]);
  }

  async findByProductId(productId: string, productVariantId?: string, activeOnly = false): Promise<ProductDownload[]> {
    let sql = `SELECT * FROM "productDownload" WHERE "productId" = $1`;
    const params: any[] = [productId];

    if (productVariantId) {
      sql += ` AND "productVariantId" = $2`;
      params.push(productVariantId);
    }

    if (activeOnly) {
      sql += productVariantId ? ` AND "isActive" = true` : ` AND "isActive" = true`;
    }

    sql += ` ORDER BY "sortOrder" ASC, "name" ASC`;
    return (await query<ProductDownload[]>(sql, params)) || [];
  }

  async findByVariantId(productVariantId: string, activeOnly = false): Promise<ProductDownload[]> {
    let sql = `SELECT * FROM "productDownload" WHERE "productVariantId" = $1`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    sql += ` ORDER BY "sortOrder" ASC`;
    return (await query<ProductDownload[]>(sql, [productVariantId])) || [];
  }

  async create(params: ProductDownloadCreateParams): Promise<ProductDownload> {
    const now = unixTimestamp();

    const result = await queryOne<ProductDownload>(
      `INSERT INTO "productDownload" (
        "productId", "productVariantId", "name", "fileUrl", "filePath", "fileSize", "mimeType",
        "maxDownloads", "daysValid", "isActive", "sampleUrl", "sortOrder", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        params.productId,
        params.productVariantId || null,
        params.name,
        params.fileUrl,
        params.filePath || null,
        params.fileSize || null,
        params.mimeType || null,
        params.maxDownloads || null,
        params.daysValid || null,
        params.isActive ?? true,
        params.sampleUrl || null,
        params.sortOrder || 0,
        now,
        now,
      ],
    );

    if (!result) throw new Error('Failed to create product download');
    return result;
  }

  async update(id: string, params: ProductDownloadUpdateParams): Promise<ProductDownload | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<ProductDownload>(
      `UPDATE "productDownload" SET ${updateFields.join(', ')} WHERE "productDownloadId" = $${paramIndex} RETURNING *`,
      values,
    );
  }

  async reorder(downloads: Array<{ productDownloadId: string; sortOrder: number }>): Promise<void> {
    const now = unixTimestamp();
    for (const download of downloads) {
      await this.update(download.productDownloadId, { sortOrder: download.sortOrder });
    }
  }

  async activate(id: string): Promise<ProductDownload | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<ProductDownload | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ productDownloadId: string }>(
      `DELETE FROM "productDownload" WHERE "productDownloadId" = $1 RETURNING "productDownloadId"`,
      [id],
    );
    return !!result;
  }

  async deleteByProductId(productId: string, productVariantId?: string): Promise<number> {
    let sql = `DELETE FROM "productDownload" WHERE "productId" = $1`;
    const params: any[] = [productId];

    if (productVariantId) {
      sql += ` AND "productVariantId" = $2`;
      params.push(productVariantId);
    }

    sql += ` RETURNING "productDownloadId"`;
    const results = await query<{ productDownloadId: string }[]>(sql, params);
    return results ? results.length : 0;
  }

  async count(productId?: string): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "productDownload"`;
    const params: any[] = [];

    if (productId) {
      sql += ` WHERE "productId" = $1`;
      params.push(productId);
    }

    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }

  async getStatistics(): Promise<{ total: number; active: number; byProduct: Record<string, number> }> {
    const total = await this.count();

    const activeResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "productDownload" WHERE "isActive" = true`);
    const active = activeResult ? parseInt(activeResult.count, 10) : 0;

    const productResults = await query<{ productId: string; count: string }[]>(
      `SELECT "productId", COUNT(*) as count FROM "productDownload" GROUP BY "productId"`,
    );
    const byProduct: Record<string, number> = {};
    productResults?.forEach(row => {
      byProduct[row.productId] = parseInt(row.count, 10);
    });

    return { total, active, byProduct };
  }
}

export default new ProductDownloadRepo();
