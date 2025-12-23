import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type SupplierProductStatus = 'active' | 'inactive' | 'discontinued' | 'pending';

export interface SupplierProduct {
  supplierProductId: string;
  createdAt: string;
  updatedAt: string;
  supplierId: string;
  productId: string;
  productVariantId?: string;
  sku: string;
  supplierSku?: string;
  supplierProductName?: string;
  status: SupplierProductStatus;
  isPreferred: boolean;
  unitCost: number;
  currency: string;
  minimumOrderQuantity: number;
  leadTime?: number;
  packagingInfo?: Record<string, any>;
  dimensions?: Record<string, any>;
  weight?: number;
  lastOrderedAt?: string;
  notes?: string;
}

export type SupplierProductCreateParams = Omit<SupplierProduct, 'supplierProductId' | 'createdAt' | 'updatedAt'>;
export type SupplierProductUpdateParams = Partial<
  Omit<SupplierProduct, 'supplierProductId' | 'supplierId' | 'productId' | 'createdAt' | 'updatedAt'>
>;

export class SupplierProductRepo {
  async findById(id: string): Promise<SupplierProduct | null> {
    return await queryOne<SupplierProduct>(`SELECT * FROM "supplierProduct" WHERE "supplierProductId" = $1`, [id]);
  }

  async findBySupplierId(supplierId: string, activeOnly = false): Promise<SupplierProduct[]> {
    let sql = `SELECT * FROM "supplierProduct" WHERE "supplierId" = $1`;
    if (activeOnly) sql += ` AND "status" = 'active'`;
    sql += ` ORDER BY "isPreferred" DESC, "unitCost" ASC`;
    return (await query<SupplierProduct[]>(sql, [supplierId])) || [];
  }

  async findByProduct(productId: string, productVariantId?: string): Promise<SupplierProduct[]> {
    let sql = `SELECT * FROM "supplierProduct" WHERE "productId" = $1`;
    const params: any[] = [productId];

    if (productVariantId) {
      sql += ` AND "productVariantId" = $2`;
      params.push(productVariantId);
    }

    sql += ` ORDER BY "isPreferred" DESC, "unitCost" ASC`;
    return (await query<SupplierProduct[]>(sql, params)) || [];
  }

  async findBySku(sku: string): Promise<SupplierProduct[]> {
    return (await query<SupplierProduct[]>(`SELECT * FROM "supplierProduct" WHERE "sku" = $1 ORDER BY "unitCost" ASC`, [sku])) || [];
  }

  async findBySupplierSku(supplierSku: string): Promise<SupplierProduct[]> {
    return (await query<SupplierProduct[]>(`SELECT * FROM "supplierProduct" WHERE "supplierSku" = $1`, [supplierSku])) || [];
  }

  async findPreferred(productId: string, productVariantId?: string): Promise<SupplierProduct | null> {
    let sql = `SELECT * FROM "supplierProduct" WHERE "productId" = $1 AND "isPreferred" = true AND "status" = 'active'`;
    const params: any[] = [productId];

    if (productVariantId) {
      sql += ` AND "productVariantId" = $2`;
      params.push(productVariantId);
    }

    sql += ` LIMIT 1`;
    return await queryOne<SupplierProduct>(sql, params);
  }

  async findByStatus(status: SupplierProductStatus, limit = 100): Promise<SupplierProduct[]> {
    return (
      (await query<SupplierProduct[]>(`SELECT * FROM "supplierProduct" WHERE "status" = $1 ORDER BY "supplierId" LIMIT $2`, [
        status,
        limit,
      ])) || []
    );
  }

  async create(params: SupplierProductCreateParams): Promise<SupplierProduct> {
    const now = unixTimestamp();

    const result = await queryOne<SupplierProduct>(
      `INSERT INTO "supplierProduct" (
        "supplierId", "productId", "productVariantId", "sku", "supplierSku", "supplierProductName",
        "status", "isPreferred", "unitCost", "currency", "minimumOrderQuantity", "leadTime",
        "packagingInfo", "dimensions", "weight", "notes", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
      [
        params.supplierId,
        params.productId,
        params.productVariantId || null,
        params.sku,
        params.supplierSku || null,
        params.supplierProductName || null,
        params.status || 'active',
        params.isPreferred || false,
        params.unitCost,
        params.currency || 'USD',
        params.minimumOrderQuantity || 1,
        params.leadTime || null,
        params.packagingInfo ? JSON.stringify(params.packagingInfo) : null,
        params.dimensions ? JSON.stringify(params.dimensions) : null,
        params.weight || null,
        params.notes || null,
        now,
        now,
      ],
    );

    if (!result) throw new Error('Failed to create supplier product');
    return result;
  }

  async update(id: string, params: SupplierProductUpdateParams): Promise<SupplierProduct | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        const jsonFields = ['packagingInfo', 'dimensions'];
        values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<SupplierProduct>(
      `UPDATE "supplierProduct" SET ${updateFields.join(', ')} WHERE "supplierProductId" = $${paramIndex} RETURNING *`,
      values,
    );
  }

  async setAsPreferred(id: string): Promise<SupplierProduct | null> {
    const product = await this.findById(id);
    if (!product) return null;

    // Unset other preferred for same product
    await query(
      `UPDATE "supplierProduct" SET "isPreferred" = false, "updatedAt" = $1 
       WHERE "productId" = $2 AND "productVariantId" ${product.productVariantId ? '= $3' : 'IS NULL'} AND "isPreferred" = true`,
      product.productVariantId ? [unixTimestamp(), product.productId, product.productVariantId] : [unixTimestamp(), product.productId],
    );

    return this.update(id, { isPreferred: true });
  }

  async updateLastOrdered(id: string): Promise<void> {
    await query(`UPDATE "supplierProduct" SET "lastOrderedAt" = $1, "updatedAt" = $1 WHERE "supplierProductId" = $2`, [
      unixTimestamp(),
      id,
    ]);
  }

  async activate(id: string): Promise<SupplierProduct | null> {
    return this.update(id, { status: 'active' });
  }

  async deactivate(id: string): Promise<SupplierProduct | null> {
    return this.update(id, { status: 'inactive' });
  }

  async discontinue(id: string): Promise<SupplierProduct | null> {
    return this.update(id, { status: 'discontinued' });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ supplierProductId: string }>(
      `DELETE FROM "supplierProduct" WHERE "supplierProductId" = $1 RETURNING "supplierProductId"`,
      [id],
    );
    return !!result;
  }

  async getStatistics(): Promise<{ total: number; byStatus: Record<SupplierProductStatus, number>; preferred: number }> {
    const totalResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "supplierProduct"`);
    const total = totalResult ? parseInt(totalResult.count, 10) : 0;

    const statusResults = await query<{ status: SupplierProductStatus; count: string }[]>(
      `SELECT "status", COUNT(*) as count FROM "supplierProduct" GROUP BY "status"`,
    );
    const byStatus: Record<string, number> = {};
    statusResults?.forEach(row => {
      byStatus[row.status] = parseInt(row.count, 10);
    });

    const preferredResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "supplierProduct" WHERE "isPreferred" = true`);
    const preferred = preferredResult ? parseInt(preferredResult.count, 10) : 0;

    return { total, byStatus: byStatus as Record<SupplierProductStatus, number>, preferred };
  }
}

export default new SupplierProductRepo();
