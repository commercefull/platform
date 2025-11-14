import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type ItemStatus = 'received' | 'inspecting' | 'accepted' | 'rejected' | 'partial';
export type AcceptanceStatus = 'pending' | 'accepted' | 'rejected' | 'partial';

export interface ReceivingItem {
  receivingItemId: string;
  createdAt: string;
  updatedAt: string;
  receivingRecordId: string;
  purchaseOrderItemId?: string;
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
  status: ItemStatus;
  acceptanceStatus?: AcceptanceStatus;
  inspectionNotes?: string;
  discrepancyReason?: string;
  processedAt?: string;
  processedBy?: string;
}

export type ReceivingItemCreateParams = Omit<ReceivingItem, 'receivingItemId' | 'createdAt' | 'updatedAt'>;
export type ReceivingItemUpdateParams = Partial<Pick<ReceivingItem, 'receivedQuantity' | 'rejectedQuantity' | 'status' | 'acceptanceStatus' | 'inspectionNotes' | 'discrepancyReason' | 'processedAt' | 'processedBy'>>;

export class ReceivingItemRepo {
  async findById(id: string): Promise<ReceivingItem | null> {
    return await queryOne<ReceivingItem>(`SELECT * FROM "receivingItem" WHERE "receivingItemId" = $1`, [id]);
  }

  async findByReceivingRecordId(receivingRecordId: string): Promise<ReceivingItem[]> {
    return (await query<ReceivingItem[]>(
      `SELECT * FROM "receivingItem" WHERE "receivingRecordId" = $1 ORDER BY "createdAt" ASC`,
      [receivingRecordId]
    )) || [];
  }

  async findByPurchaseOrderItemId(purchaseOrderItemId: string): Promise<ReceivingItem[]> {
    return (await query<ReceivingItem[]>(
      `SELECT * FROM "receivingItem" WHERE "purchaseOrderItemId" = $1 ORDER BY "createdAt" DESC`,
      [purchaseOrderItemId]
    )) || [];
  }

  async findByProduct(productId: string, productVariantId?: string): Promise<ReceivingItem[]> {
    let sql = `SELECT * FROM "receivingItem" WHERE "productId" = $1`;
    const params: any[] = [productId];

    if (productVariantId) {
      sql += ` AND "productVariantId" = $2`;
      params.push(productVariantId);
    }

    sql += ` ORDER BY "createdAt" DESC`;
    return (await query<ReceivingItem[]>(sql, params)) || [];
  }

  async findByStatus(status: ItemStatus, limit = 100): Promise<ReceivingItem[]> {
    return (await query<ReceivingItem[]>(
      `SELECT * FROM "receivingItem" WHERE "status" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
      [status, limit]
    )) || [];
  }

  async findByAcceptanceStatus(acceptanceStatus: AcceptanceStatus): Promise<ReceivingItem[]> {
    return (await query<ReceivingItem[]>(
      `SELECT * FROM "receivingItem" WHERE "acceptanceStatus" = $1 ORDER BY "createdAt" DESC`,
      [acceptanceStatus]
    )) || [];
  }

  async findWithDiscrepancies(): Promise<ReceivingItem[]> {
    return (await query<ReceivingItem[]>(
      `SELECT * FROM "receivingItem" WHERE "discrepancyReason" IS NOT NULL OR "rejectedQuantity" > 0 ORDER BY "createdAt" DESC`
    )) || [];
  }

  async create(params: ReceivingItemCreateParams): Promise<ReceivingItem> {
    const now = unixTimestamp();

    const result = await queryOne<ReceivingItem>(
      `INSERT INTO "receivingItem" (
        "receivingRecordId", "purchaseOrderItemId", "productId", "productVariantId", "sku", "name",
        "expectedQuantity", "receivedQuantity", "rejectedQuantity", "warehouseBinId", "lotNumber",
        "serialNumbers", "expiryDate", "status", "acceptanceStatus", "inspectionNotes",
        "discrepancyReason", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
      [
        params.receivingRecordId, params.purchaseOrderItemId || null, params.productId,
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

  async update(id: string, params: ReceivingItemUpdateParams): Promise<ReceivingItem | null> {
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

    return await queryOne<ReceivingItem>(
      `UPDATE "receivingItem" SET ${updateFields.join(', ')} WHERE "receivingItemId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async accept(id: string, processedBy?: string): Promise<ReceivingItem | null> {
    return this.update(id, {
      status: 'accepted',
      acceptanceStatus: 'accepted',
      processedAt: unixTimestamp(),
      processedBy
    });
  }

  async reject(id: string, reason: string, processedBy?: string): Promise<ReceivingItem | null> {
    return this.update(id, {
      status: 'rejected',
      acceptanceStatus: 'rejected',
      discrepancyReason: reason,
      processedAt: unixTimestamp(),
      processedBy
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ receivingItemId: string }>(
      `DELETE FROM "receivingItem" WHERE "receivingItemId" = $1 RETURNING "receivingItemId"`,
      [id]
    );
    return !!result;
  }

  async getStatistics(): Promise<{ byStatus: Record<ItemStatus, number>; byAcceptance: Record<AcceptanceStatus, number> }> {
    const statusResults = await query<{ status: ItemStatus; count: string }[]>(
      `SELECT "status", COUNT(*) as count FROM "receivingItem" GROUP BY "status"`
    );
    const byStatus: Record<string, number> = {};
    statusResults?.forEach(row => { byStatus[row.status] = parseInt(row.count, 10); });

    const acceptanceResults = await query<{ acceptanceStatus: AcceptanceStatus; count: string }[]>(
      `SELECT "acceptanceStatus", COUNT(*) as count FROM "receivingItem" WHERE "acceptanceStatus" IS NOT NULL GROUP BY "acceptanceStatus"`
    );
    const byAcceptance: Record<string, number> = {};
    acceptanceResults?.forEach(row => { byAcceptance[row.acceptanceStatus] = parseInt(row.count, 10); });

    return {
      byStatus: byStatus as Record<ItemStatus, number>,
      byAcceptance: byAcceptance as Record<AcceptanceStatus, number>
    };
  }
}

export default new ReceivingItemRepo();
