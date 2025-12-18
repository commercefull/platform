/**
 * Supplier Receiving Record Repository
 * Manages receiving records for supplier shipments
 */

import { query, queryOne } from '../../../libs/db';
import { Table } from '../../../libs/db/types';
import { unixTimestamp } from '../../../libs/date';

// ============================================================================
// Table Constants
// ============================================================================

const TABLE = Table.SupplierReceivingRecord;

// ============================================================================
// Types
// ============================================================================

export type SupplierReceivingStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

export interface SupplierReceivingRecord {
  supplierReceivingRecordId: string;
  createdAt: string;
  updatedAt: string;
  receiptNumber: string;
  supplierPurchaseOrderId?: string;
  warehouseId: string;
  supplierId: string;
  status: SupplierReceivingStatus;
  receivedDate: string;
  carrierName?: string;
  trackingNumber?: string;
  packageCount?: number;
  notes?: string;
  discrepancies: boolean;
  attachments?: Record<string, any>;
  completedAt?: string;
}

export type SupplierReceivingRecordCreateParams = Omit<SupplierReceivingRecord, 'supplierReceivingRecordId' | 'createdAt' | 'updatedAt' | 'receiptNumber'>;
export type SupplierReceivingRecordUpdateParams = Partial<Pick<SupplierReceivingRecord, 'status' | 'carrierName' | 'trackingNumber' | 'packageCount' | 'notes' | 'discrepancies' | 'attachments' | 'completedAt'>>;

export class SupplierReceivingRecordRepo {
  private async generateReceiptNumber(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RCV-${timestamp}-${random}`;
  }

  async findById(id: string): Promise<SupplierReceivingRecord | null> {
    return await queryOne<SupplierReceivingRecord>(`SELECT * FROM "supplierReceivingRecord" WHERE "supplierReceivingRecordId" = $1`, [id]);
  }

  async findByReceiptNumber(receiptNumber: string): Promise<SupplierReceivingRecord | null> {
    return await queryOne<SupplierReceivingRecord>(`SELECT * FROM "supplierReceivingRecord" WHERE "receiptNumber" = $1`, [receiptNumber]);
  }

  async findByPurchaseOrderId(supplierPurchaseOrderId: string): Promise<SupplierReceivingRecord[]> {
    return (await query<SupplierReceivingRecord[]>(
      `SELECT * FROM "supplierReceivingRecord" WHERE "supplierPurchaseOrderId" = $1 ORDER BY "createdAt" DESC`,
      [supplierPurchaseOrderId]
    )) || [];
  }

  async findByWarehouseId(warehouseId: string, limit = 50): Promise<SupplierReceivingRecord[]> {
    return (await query<SupplierReceivingRecord[]>(
      `SELECT * FROM "supplierReceivingRecord" WHERE "warehouseId" = $1 ORDER BY "receivedDate" DESC LIMIT $2`,
      [warehouseId, limit]
    )) || [];
  }

  async findBySupplierId(supplierId: string, limit = 50): Promise<SupplierReceivingRecord[]> {
    return (await query<SupplierReceivingRecord[]>(
      `SELECT * FROM "supplierReceivingRecord" WHERE "supplierId" = $1 ORDER BY "receivedDate" DESC LIMIT $2`,
      [supplierId, limit]
    )) || [];
  }

  async findByStatus(status: SupplierReceivingStatus, limit = 100): Promise<SupplierReceivingRecord[]> {
    return (await query<SupplierReceivingRecord[]>(
      `SELECT * FROM "supplierReceivingRecord" WHERE "status" = $1 ORDER BY "receivedDate" DESC LIMIT $2`,
      [status, limit]
    )) || [];
  }

  async findWithDiscrepancies(): Promise<SupplierReceivingRecord[]> {
    return (await query<SupplierReceivingRecord[]>(
      `SELECT * FROM "supplierReceivingRecord" WHERE "discrepancies" = true ORDER BY "receivedDate" DESC`
    )) || [];
  }

  async create(params: SupplierReceivingRecordCreateParams): Promise<SupplierReceivingRecord> {
    const now = unixTimestamp();
    const receiptNumber = await this.generateReceiptNumber();

    const result = await queryOne<SupplierReceivingRecord>(
      `INSERT INTO "supplierReceivingRecord" (
        "receiptNumber", "supplierPurchaseOrderId", "warehouseId", "supplierId", "status", "receivedDate",
        "carrierName", "trackingNumber", "packageCount", "notes", "discrepancies", "attachments",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        receiptNumber, params.supplierPurchaseOrderId || null, params.warehouseId, params.supplierId,
        params.status || 'pending', params.receivedDate || now, params.carrierName || null,
        params.trackingNumber || null, params.packageCount || null, params.notes || null,
        params.discrepancies || false, params.attachments ? JSON.stringify(params.attachments) : null,
        now, now
      ]
    );

    if (!result) throw new Error('Failed to create receiving record');
    return result;
  }

  async update(id: string, params: SupplierReceivingRecordUpdateParams): Promise<SupplierReceivingRecord | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(key === 'attachments' && value ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<SupplierReceivingRecord>(
      `UPDATE "supplierReceivingRecord" SET ${updateFields.join(', ')} WHERE "supplierReceivingRecordId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async complete(id: string): Promise<SupplierReceivingRecord | null> {
    return this.update(id, { status: 'completed', completedAt: unixTimestamp() });
  }

  async cancel(id: string): Promise<SupplierReceivingRecord | null> {
    return this.update(id, { status: 'cancelled' });
  }

  async markAsDisputed(id: string): Promise<SupplierReceivingRecord | null> {
    return this.update(id, { status: 'disputed', discrepancies: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ supplierReceivingRecordId: string }>(
      `DELETE FROM "supplierReceivingRecord" WHERE "supplierReceivingRecordId" = $1 RETURNING "supplierReceivingRecordId"`,
      [id]
    );
    return !!result;
  }

  async getStatistics(): Promise<Record<SupplierReceivingStatus, number> & { withDiscrepancies: number }> {
    const results = await query<{ status: SupplierReceivingStatus; count: string }[]>(
      `SELECT "status", COUNT(*) as count FROM "supplierReceivingRecord" GROUP BY "status"`
    );
    const stats: Record<string, number> = {};
    results?.forEach(row => { stats[row.status] = parseInt(row.count, 10); });

    const discrepancyResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "supplierReceivingRecord" WHERE "discrepancies" = true`
    );
    stats.withDiscrepancies = discrepancyResult ? parseInt(discrepancyResult.count, 10) : 0;

    return stats as Record<SupplierReceivingStatus, number> & { withDiscrepancies: number };
  }
}

export default new SupplierReceivingRecordRepo();
