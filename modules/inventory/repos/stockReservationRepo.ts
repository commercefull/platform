import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

// Import types from generated DB types - single source of truth
import { StockReservation as DbStockReservation } from '../../../libs/db/types';

// Re-export DB type
export type StockReservation = DbStockReservation;

// Type alias for reservation type (used in application logic)
export type StockReservationType = 'cart' | 'order' | 'pending' | 'custom';

// Derived types for create/update operations
export type StockReservationCreateParams = Omit<StockReservation, 'stockReservationId' | 'createdAt' | 'updatedAt'>;
export type StockReservationUpdateParams = Partial<Omit<StockReservation, 'stockReservationId' | 'productId' | 'createdAt' | 'updatedAt'>>;

export class StockReservationRepo {
  async findById(id: string): Promise<StockReservation | null> {
    return await queryOne<StockReservation>(`SELECT * FROM "stockReservation" WHERE "stockReservationId" = $1`, [id]);
  }

  async findByProduct(productId: string, warehouseId?: string): Promise<StockReservation[]> {
    let sql = `SELECT * FROM "stockReservation" WHERE "productId" = $1`;
    const params: any[] = [productId];
    if (warehouseId) {
      sql += ` AND "distributionWarehouseId" = $2`;
      params.push(warehouseId);
    }
    sql += ` ORDER BY "createdAt" DESC`;
    return (await query<StockReservation[]>(sql, params)) || [];
  }

  async findByReference(referenceType: string, referenceId: string): Promise<StockReservation[]> {
    return (await query<StockReservation[]>(
      `SELECT * FROM "stockReservation" WHERE "referenceType" = $1 AND "referenceId" = $2 ORDER BY "createdAt" DESC`,
      [referenceType, referenceId]
    )) || [];
  }

  async findExpired(): Promise<StockReservation[]> {
    return (await query<StockReservation[]>(
      `SELECT * FROM "stockReservation" WHERE "expiresAt" IS NOT NULL AND "expiresAt" < $1 ORDER BY "expiresAt" ASC`,
      [unixTimestamp()]
    )) || [];
  }

  async create(params: StockReservationCreateParams): Promise<StockReservation> {
    const now = unixTimestamp();
    const result = await queryOne<StockReservation>(
      `INSERT INTO "stockReservation" (
        "productId", "productVariantId", "distributionWarehouseId", "quantity", "reservationType",
        "referenceId", "referenceType", "expiresAt", "createdBy", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        params.productId, params.productVariantId || null, params.distributionWarehouseId, params.quantity,
        params.reservationType, params.referenceId || null, params.referenceType || null,
        params.expiresAt || null, params.createdBy || null, now, now
      ]
    );
    if (!result) throw new Error('Failed to create stock reservation');
    return result;
  }

  async update(id: string, params: StockReservationUpdateParams): Promise<StockReservation | null> {
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

    return await queryOne<StockReservation>(
      `UPDATE "stockReservation" SET ${updateFields.join(', ')} WHERE "stockReservationId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ stockReservationId: string }>(
      `DELETE FROM "stockReservation" WHERE "stockReservationId" = $1 RETURNING "stockReservationId"`,
      [id]
    );
    return !!result;
  }

  async deleteExpired(): Promise<number> {
    const results = await query<{ stockReservationId: string }[]>(
      `DELETE FROM "stockReservation" WHERE "expiresAt" IS NOT NULL AND "expiresAt" < $1 RETURNING "stockReservationId"`,
      [unixTimestamp()]
    );
    return results ? results.length : 0;
  }

  async getTotalReserved(productId: string, warehouseId?: string, productVariantId?: string): Promise<number> {
    let sql = `SELECT SUM("quantity") as total FROM "stockReservation" WHERE "productId" = $1`;
    const params: any[] = [productId];

    if (warehouseId) {
      sql += ` AND "distributionWarehouseId" = $${params.length + 1}`;
      params.push(warehouseId);
    }
    if (productVariantId) {
      sql += ` AND "productVariantId" = $${params.length + 1}`;
      params.push(productVariantId);
    }
    sql += ` AND ("expiresAt" IS NULL OR "expiresAt" >= $${params.length + 1})`;
    params.push(unixTimestamp());

    const result = await queryOne<{ total: string }>(sql, params);
    return result ? parseInt(result.total, 10) || 0 : 0;
  }

  async count(productId?: string): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "stockReservation"`;
    const params: any[] = [];
    if (productId) {
      sql += ` WHERE "productId" = $1`;
      params.push(productId);
    }
    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new StockReservationRepo();
