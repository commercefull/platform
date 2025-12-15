/**
 * Supplier Receiving Item Repository
 * Manages individual items in receiving records
 */

import { query, queryOne } from '../../../libs/db';
import { Table } from '../../../libs/db/types';
import { unixTimestamp } from '../../../libs/date';

// ============================================================================
// Table Constants
// ============================================================================

const TABLE = Table.SupplierReceivingItem;

// ============================================================================
// Types
// ============================================================================

export type SupplierReceivingItemStatus = 'received' | 'inspecting' | 'accepted' | 'rejected' | 'partial';
export type SupplierReceivingAcceptanceStatus = 'pending' | 'accepted' | 'rejected' | 'partial';

export interface SupplierReceivingItem {
  supplierReceivingItemId: string;
  createdAt: string;
  updatedAt: string;
  supplierReceivingRecordId: string;
  supplierPurchaseOrderItemId?: string;
  productId: string;
  productVariantId?: string;
  sku: string;
  name: string;
  expectedQuantity?: number;
  receivedQuantity: number;
  rejectedQuantity: number;
  warehouseBinId?: string;
  lotNumber?: string;
  serialNumbers?: string[];
  expiryDate?: string;
  status: SupplierReceivingItemStatus;
  acceptanceStatus?: SupplierReceivingAcceptanceStatus;
  inspectionNotes?: string;
  discrepancyReason?: string;
  processedAt?: string;
  processedBy?: string;
}

export type SupplierReceivingItemCreateParams = Omit<SupplierReceivingItem, 'supplierReceivingItemId' | 'createdAt' | 'updatedAt'>;
export type SupplierReceivingItemUpdateParams = Partial<Pick<SupplierReceivingItem, 'receivedQuantity' | 'rejectedQuantity' | 'status' | 'acceptanceStatus' | 'inspectionNotes' | 'discrepancyReason' | 'processedAt' | 'processedBy'>>;

export class SupplierReceivingItemRepo {
  async findById(id: string): Promise<SupplierReceivingItem | null> {
    return await queryOne<SupplierReceivingItem>(`SELECT * FROM "supplierReceivingItem" WHERE "supplierReceivingItemId" = $1`, [id]);
  }

  async findByReceivingRecordId(supplierReceivingRecordId: string): Promise<SupplierReceivingItem[]> {
    return (await query<SupplierReceivingItem[]>(
      `SELECT * FROM "supplierReceivingItem" WHERE "supplierReceivingRecordId" = $1 ORDER BY "createdAt" ASC`,
      [supplierReceivingRecordId]
    )) || [];
  }

  async findByPurchaseOrderItemId(supplierPurchaseOrderItemId: string): Promise<SupplierReceivingItem[]> {
    return (await query<SupplierReceivingItem[]>(
      `SELECT * FROM "supplierReceivingItem" WHERE "supplierPurchaseOrderItemId" = $1 ORDER BY "createdAt" DESC`,
      [supplierPurchaseOrderItemId]
    )) || [];
  }

  async findByProduct(productId: string, productVariantId?: string): Promise<SupplierReceivingItem[]> {
    let sql = `SELECT * FROM "supplierReceivingItem" WHERE "productId" = $1`;
    const params: any[] = [productId];

    if (productVariantId) {
      sql += ` AND "productVariantId" = $2`;
      params.push(productVariantId);
    }

    sql += ` ORDER BY "createdAt" DESC`;
    return (await query<SupplierReceivingItem[]>(sql, params)) || [];
  }

  async findByStatus(status: SupplierReceivingItemStatus, limit = 100): Promise<SupplierReceivingItem[]> {
    return (await query<SupplierReceivingItem[]>(
      `SELECT * FROM "supplierReceivingItem" WHERE "status" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
      [status, limit]
    )) || [];
  }

  async findBySupplierReceivingAcceptanceStatus(acceptanceStatus: SupplierReceivingAcceptanceStatus): Promise<SupplierReceivingItem[]> {
    return (await query<SupplierReceivingItem[]>(
      `SELECT * FROM "supplierReceivingItem" WHERE "acceptanceStatus" = $1 ORDER BY "createdAt" DESC`,
      [acceptanceStatus]
    )) || [];
  }

  async findWithDiscrepancies(): Promise<SupplierReceivingItem[]> {
    return (await query<SupplierReceivingItem[]>(
      `SELECT * FROM "supplierReceivingItem" WHERE "discrepancyReason" IS NOT NULL OR "rejectedQuantity" > 0 ORDER BY "createdAt" DESC`
    )) || [];
  }

  async create(params: SupplierReceivingItemCreateParams): Promise<SupplierReceivingItem> {
    const now = unixTimestamp();

    const result = await queryOne<SupplierReceivingItem>(
      `INSERT INTO "supplierReceivingItem" (
        "supplierReceivingRecordId", "supplierPurchaseOrderItemId", "productId", "productVariantId", "sku", "name",
        "expectedQuantity", "receivedQuantity", "rejectedQuantity", "warehouseBinId", "lotNumber",
        "serialNumbers", "expiryDate", "status", "acceptanceStatus", "inspectionNotes",
        "discrepancyReason", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
      [
        params.supplierReceivingRecordId, params.supplierPurchaseOrderItemId || null, params.productId,
        params.productVariantId || null, params.sku, params.name, params.expectedQuantity || null,
        params.receivedQuantity, params.rejectedQuantity || 0, params.warehouseBinId || null,
        params.lotNumber || null, params.serialNumbers || null, params.expiryDate || null,
        params.status || 'received', params.acceptanceStatus || 'pending', params.inspectionNotes || null,
        params.discrepancyReason || null, now, now
      ]
    );

    if (!result) throw new Error('Failed to create receiving item');
    return result;
  }

  async update(id: string, params: SupplierReceivingItemUpdateParams): Promise<SupplierReceivingItem | null> {
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

    return await queryOne<SupplierReceivingItem>(
      `UPDATE "supplierReceivingItem" SET ${updateFields.join(', ')} WHERE "supplierReceivingItemId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async accept(id: string, processedBy?: string): Promise<SupplierReceivingItem | null> {
    return this.update(id, {
      status: 'accepted',
      acceptanceStatus: 'accepted',
      processedAt: unixTimestamp(),
      processedBy
    });
  }

  async reject(id: string, reason: string, processedBy?: string): Promise<SupplierReceivingItem | null> {
    return this.update(id, {
      status: 'rejected',
      acceptanceStatus: 'rejected',
      discrepancyReason: reason,
      processedAt: unixTimestamp(),
      processedBy
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ supplierReceivingItemId: string }>(
      `DELETE FROM "supplierReceivingItem" WHERE "supplierReceivingItemId" = $1 RETURNING "supplierReceivingItemId"`,
      [id]
    );
    return !!result;
  }

  async getStatistics(): Promise<{ byStatus: Record<SupplierReceivingItemStatus, number>; byAcceptance: Record<SupplierReceivingAcceptanceStatus, number> }> {
    const statusResults = await query<{ status: SupplierReceivingItemStatus; count: string }[]>(
      `SELECT "status", COUNT(*) as count FROM "supplierReceivingItem" GROUP BY "status"`
    );
    const byStatus: Record<string, number> = {};
    statusResults?.forEach(row => { byStatus[row.status] = parseInt(row.count, 10); });

    const acceptanceResults = await query<{ acceptanceStatus: SupplierReceivingAcceptanceStatus; count: string }[]>(
      `SELECT "acceptanceStatus", COUNT(*) as count FROM "supplierReceivingItem" WHERE "acceptanceStatus" IS NOT NULL GROUP BY "acceptanceStatus"`
    );
    const byAcceptance: Record<string, number> = {};
    acceptanceResults?.forEach(row => { byAcceptance[row.acceptanceStatus] = parseInt(row.count, 10); });

    return {
      byStatus: byStatus as Record<SupplierReceivingItemStatus, number>,
      byAcceptance: byAcceptance as Record<SupplierReceivingAcceptanceStatus, number>
    };
  }
}

export default new SupplierReceivingItemRepo();
