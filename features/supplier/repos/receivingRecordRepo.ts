import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type ReceivingStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

export interface ReceivingRecord {
  receivingRecordId: string;
  createdAt: string;
  updatedAt: string;
  receiptNumber: string;
  purchaseOrderId?: string;
  warehouseId: string;
  supplierId: string;
  status: ReceivingStatus;
  receivedDate: string;
  carrierName?: string;
  trackingNumber?: string;
  packageCount?: number;
  notes?: string;
  discrepancies: boolean;
  attachments?: Record<string, any>;
  completedAt?: string;
}

export type ReceivingRecordCreateParams = Omit<ReceivingRecord, 'receivingRecordId' | 'createdAt' | 'updatedAt' | 'receiptNumber'>;
export type ReceivingRecordUpdateParams = Partial<Pick<ReceivingRecord, 'status' | 'carrierName' | 'trackingNumber' | 'packageCount' | 'notes' | 'discrepancies' | 'attachments' | 'completedAt'>>;

export class ReceivingRecordRepo {
  private async generateReceiptNumber(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RCV-${timestamp}-${random}`;
  }

  async findById(id: string): Promise<ReceivingRecord | null> {
    return await queryOne<ReceivingRecord>(`SELECT * FROM "receivingRecord" WHERE "receivingRecordId" = $1`, [id]);
  }

  async findByReceiptNumber(receiptNumber: string): Promise<ReceivingRecord | null> {
    return await queryOne<ReceivingRecord>(`SELECT * FROM "receivingRecord" WHERE "receiptNumber" = $1`, [receiptNumber]);
  }

  async findByPurchaseOrderId(purchaseOrderId: string): Promise<ReceivingRecord[]> {
    return (await query<ReceivingRecord[]>(
      `SELECT * FROM "receivingRecord" WHERE "purchaseOrderId" = $1 ORDER BY "createdAt" DESC`,
      [purchaseOrderId]
    )) || [];
  }

  async findByWarehouseId(warehouseId: string, limit = 50): Promise<ReceivingRecord[]> {
    return (await query<ReceivingRecord[]>(
      `SELECT * FROM "receivingRecord" WHERE "warehouseId" = $1 ORDER BY "receivedDate" DESC LIMIT $2`,
      [warehouseId, limit]
    )) || [];
  }

  async findBySupplierId(supplierId: string, limit = 50): Promise<ReceivingRecord[]> {
    return (await query<ReceivingRecord[]>(
      `SELECT * FROM "receivingRecord" WHERE "supplierId" = $1 ORDER BY "receivedDate" DESC LIMIT $2`,
      [supplierId, limit]
    )) || [];
  }

  async findByStatus(status: ReceivingStatus, limit = 100): Promise<ReceivingRecord[]> {
    return (await query<ReceivingRecord[]>(
      `SELECT * FROM "receivingRecord" WHERE "status" = $1 ORDER BY "receivedDate" DESC LIMIT $2`,
      [status, limit]
    )) || [];
  }

  async findWithDiscrepancies(): Promise<ReceivingRecord[]> {
    return (await query<ReceivingRecord[]>(
      `SELECT * FROM "receivingRecord" WHERE "discrepancies" = true ORDER BY "receivedDate" DESC`
    )) || [];
  }

  async create(params: ReceivingRecordCreateParams): Promise<ReceivingRecord> {
    const now = unixTimestamp();
    const receiptNumber = await this.generateReceiptNumber();

    const result = await queryOne<ReceivingRecord>(
      `INSERT INTO "receivingRecord" (
        "receiptNumber", "purchaseOrderId", "warehouseId", "supplierId", "status", "receivedDate",
        "carrierName", "trackingNumber", "packageCount", "notes", "discrepancies", "attachments",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        receiptNumber, params.purchaseOrderId || null, params.warehouseId, params.supplierId,
        params.status || 'pending', params.receivedDate || now, params.carrierName || null,
        params.trackingNumber || null, params.packageCount || null, params.notes || null,
        params.discrepancies || false, params.attachments ? JSON.stringify(params.attachments) : null,
        now, now
      ]
    );

    if (!result) throw new Error('Failed to create receiving record');
    return result;
  }

  async update(id: string, params: ReceivingRecordUpdateParams): Promise<ReceivingRecord | null> {
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

    return await queryOne<ReceivingRecord>(
      `UPDATE "receivingRecord" SET ${updateFields.join(', ')} WHERE "receivingRecordId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async complete(id: string): Promise<ReceivingRecord | null> {
    return this.update(id, { status: 'completed', completedAt: unixTimestamp() });
  }

  async cancel(id: string): Promise<ReceivingRecord | null> {
    return this.update(id, { status: 'cancelled' });
  }

  async markAsDisputed(id: string): Promise<ReceivingRecord | null> {
    return this.update(id, { status: 'disputed', discrepancies: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ receivingRecordId: string }>(
      `DELETE FROM "receivingRecord" WHERE "receivingRecordId" = $1 RETURNING "receivingRecordId"`,
      [id]
    );
    return !!result;
  }

  async getStatistics(): Promise<Record<ReceivingStatus, number> & { withDiscrepancies: number }> {
    const results = await query<{ status: ReceivingStatus; count: string }[]>(
      `SELECT "status", COUNT(*) as count FROM "receivingRecord" GROUP BY "status"`
    );
    const stats: Record<string, number> = {};
    results?.forEach(row => { stats[row.status] = parseInt(row.count, 10); });

    const discrepancyResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "receivingRecord" WHERE "discrepancies" = true`
    );
    stats.withDiscrepancies = discrepancyResult ? parseInt(discrepancyResult.count, 10) : 0;

    return stats as Record<ReceivingStatus, number> & { withDiscrepancies: number };
  }
}

export default new ReceivingRecordRepo();
