/**
 * Supplier Receiving Item Repository
 * Manages individual items in receiving records
 */

import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';
import { FailedToCreateSupplierEntityError } from '../../domain/errors/SupplierErrors';
import type { SupplierReceivingItem as DbSupplierReceivingItem } from '../../../../libs/db/types';

// ============================================================================
// Table Constants
// ============================================================================

// ============================================================================
// Types
// ============================================================================

export type SupplierReceivingItemStatus = 'received' | 'inspecting' | 'accepted' | 'rejected' | 'partial';
export type SupplierReceivingAcceptanceStatus = 'pending' | 'accepted' | 'rejected' | 'partial';

export type SupplierReceivingItem = DbSupplierReceivingItem;

export type SupplierReceivingItemCreateParams = Omit<SupplierReceivingItem, 'supplierReceivingItemId' | 'createdAt' | 'updatedAt'>;
export type SupplierReceivingItemUpdateParams = Partial<
  Pick<
    SupplierReceivingItem,
    | 'receivedQuantity'
    | 'rejectedQuantity'
    | 'status'
    | 'acceptanceStatus'
    | 'inspectionNotes'
    | 'discrepancyReason'
    | 'processedAt'
    | 'processedBy'
  >
>;

// `||`/`??`-style defaulting kept out of the create params to keep complexity low.
function fallback<T, D>(value: T | undefined | null, defaultValue: D): T | D {
  return value || defaultValue;
}
function nvl<T, D>(value: T | undefined | null, defaultValue: D): T | D {
  return value ?? defaultValue;
}

function receivingItemInsertValues(params: SupplierReceivingItemCreateParams, now: string): unknown[] {
  return [
    params.supplierReceivingRecordId,
    fallback(params.supplierPurchaseOrderItemId, null),
    params.productId,
    fallback(params.productVariantId, null),
    params.sku,
    params.name,
    fallback(params.expectedQuantity, null),
    nvl(params.receivedQuantity, nvl(params.expectedQuantity, 0)),
    fallback(params.rejectedQuantity, 0),
    fallback(params.distributionWarehouseBinId, null),
    fallback(params.lotNumber, null),
    fallback(params.serialNumbers, null),
    fallback(params.expiryDate, null),
    fallback(params.status, 'received'),
    fallback(params.acceptanceStatus, 'pending'),
    fallback(params.inspectionNotes, null),
    fallback(params.discrepancyReason, null),
    now,
    now,
  ];
}

export class SupplierReceivingItemRepo {
  async findById(id: string): Promise<SupplierReceivingItem | null> {
    return await queryOne<DbSupplierReceivingItem>(`SELECT * FROM "supplierReceivingItem" WHERE "supplierReceivingItemId" = $1`, [id]);
  }

  async findByReceivingRecordId(supplierReceivingRecordId: string): Promise<SupplierReceivingItem[]> {
    return (
      (await query<DbSupplierReceivingItem[]>(
        `SELECT * FROM "supplierReceivingItem" WHERE "supplierReceivingRecordId" = $1 ORDER BY "createdAt" ASC`,
        [supplierReceivingRecordId],
      )) || []
    );
  }

  async findByPurchaseOrderItemId(supplierPurchaseOrderItemId: string): Promise<SupplierReceivingItem[]> {
    return (
      (await query<DbSupplierReceivingItem[]>(
        `SELECT * FROM "supplierReceivingItem" WHERE "supplierPurchaseOrderItemId" = $1 ORDER BY "createdAt" DESC`,
        [supplierPurchaseOrderItemId],
      )) || []
    );
  }

  async findByProduct(productId: string, productVariantId?: string): Promise<SupplierReceivingItem[]> {
    let sql = `SELECT * FROM "supplierReceivingItem" WHERE "productId" = $1`;
    const params: unknown[] = [productId];

    if (productVariantId) {
      sql += ` AND "productVariantId" = $2`;
      params.push(productVariantId);
    }

    sql += ` ORDER BY "createdAt" DESC`;
    return (await query<DbSupplierReceivingItem[]>(sql, params)) || [];
  }

  async findByStatus(status: SupplierReceivingItemStatus, limit = 100): Promise<SupplierReceivingItem[]> {
    return (
      (await query<DbSupplierReceivingItem[]>(
        `SELECT * FROM "supplierReceivingItem" WHERE "status" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
        [status, limit],
      )) || []
    );
  }

  async findBySupplierReceivingAcceptanceStatus(acceptanceStatus: SupplierReceivingAcceptanceStatus): Promise<SupplierReceivingItem[]> {
    return (
      (await query<DbSupplierReceivingItem[]>(
        `SELECT * FROM "supplierReceivingItem" WHERE "acceptanceStatus" = $1 ORDER BY "createdAt" DESC`,
        [acceptanceStatus],
      )) || []
    );
  }

  async findWithDiscrepancies(): Promise<SupplierReceivingItem[]> {
    return (
      (await query<DbSupplierReceivingItem[]>(
        `SELECT * FROM "supplierReceivingItem" WHERE "discrepancyReason" IS NOT NULL OR "rejectedQuantity" > 0 ORDER BY "createdAt" DESC`,
      )) || []
    );
  }

  async create(params: SupplierReceivingItemCreateParams): Promise<SupplierReceivingItem> {
    const now = unixTimestamp();

    const result = await queryOne<DbSupplierReceivingItem>(
      `INSERT INTO "supplierReceivingItem" (
        "supplierReceivingRecordId", "supplierPurchaseOrderItemId", "productId", "productVariantId", "sku", "name",
        "expectedQuantity", "receivedQuantity", "rejectedQuantity", "distributionWarehouseBinId", "lotNumber",
        "serialNumbers", "expiryDate", "status", "acceptanceStatus", "inspectionNotes",
        "discrepancyReason", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
      receivingItemInsertValues(params, now),
    );

    if (!result) throw new FailedToCreateSupplierEntityError('Failed to create receiving item');
    return result;
  }

  async update(id: string, params: SupplierReceivingItemUpdateParams): Promise<SupplierReceivingItem | null> {
    const updateFields: string[] = [];
    const values: unknown[] = [];
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

    return await queryOne<DbSupplierReceivingItem>(
      `UPDATE "supplierReceivingItem" SET ${updateFields.join(', ')} WHERE "supplierReceivingItemId" = $${paramIndex} RETURNING *`,
      values,
    );
  }

  async accept(id: string, processedBy?: string): Promise<SupplierReceivingItem | null> {
    return this.update(id, {
      status: 'accepted',
      acceptanceStatus: 'accepted',
      processedAt: new Date(),
      processedBy: processedBy ?? null,
    });
  }

  async reject(id: string, reason: string, processedBy?: string): Promise<SupplierReceivingItem | null> {
    return this.update(id, {
      status: 'rejected',
      acceptanceStatus: 'rejected',
      discrepancyReason: reason,
      processedAt: new Date(),
      processedBy: processedBy ?? null,
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ supplierReceivingItemId: string }>(
      `DELETE FROM "supplierReceivingItem" WHERE "supplierReceivingItemId" = $1 RETURNING "supplierReceivingItemId"`,
      [id],
    );
    return !!result;
  }

  async getStatistics(): Promise<{
    byStatus: Record<SupplierReceivingItemStatus, number>;
    byAcceptance: Record<SupplierReceivingAcceptanceStatus, number>;
  }> {
    const statusResults = await query<{ status: SupplierReceivingItemStatus; count: string }[]>(
      `SELECT "status", COUNT(*) as count FROM "supplierReceivingItem" GROUP BY "status"`,
    );
    const byStatus: Record<string, number> = {};
    statusResults?.forEach(row => {
      byStatus[row.status] = parseInt(row.count, 10);
    });

    const acceptanceResults = await query<{ acceptanceStatus: SupplierReceivingAcceptanceStatus; count: string }[]>(
      `SELECT "acceptanceStatus", COUNT(*) as count FROM "supplierReceivingItem" WHERE "acceptanceStatus" IS NOT NULL GROUP BY "acceptanceStatus"`,
    );
    const byAcceptance: Record<string, number> = {};
    acceptanceResults?.forEach(row => {
      byAcceptance[row.acceptanceStatus] = parseInt(row.count, 10);
    });

    return {
      byStatus: byStatus as Record<SupplierReceivingItemStatus, number>,
      byAcceptance: byAcceptance as Record<SupplierReceivingAcceptanceStatus, number>,
    };
  }
}

export default new SupplierReceivingItemRepo();
