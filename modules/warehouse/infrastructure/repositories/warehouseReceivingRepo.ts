/**
 * Warehouse Receiving Repository
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';

export interface WarehouseReceiving {
  warehouseReceivingId: string;
  distributionWarehouseId: string;
  receiptNumber: string;
  sourceType: string;
  sourceId?: string;
  status: string;
  expectedDate?: Date;
  receivedDate?: Date;
  carrierName?: string;
  trackingNumber?: string;
  packageCount?: number;
  notes?: string;
  hasDiscrepancies: boolean;
  items?: Record<string, unknown>[];
  completedAt?: Date;
  receivedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReceivingInput {
  distributionWarehouseId: string;
  receiptNumber: string;
  sourceType: string;
  sourceId?: string;
  expectedDate?: Date;
  carrierName?: string;
  trackingNumber?: string;
  packageCount?: number;
  notes?: string;
  items?: Record<string, unknown>[];
  receivedBy?: string;
}

export async function create(input: CreateReceivingInput): Promise<WarehouseReceiving> {
  const id = generateUUID();
  const now = new Date();

  const sql = `
    INSERT INTO "warehouseReceiving" (
      "warehouseReceivingId", "distributionWarehouseId", "receiptNumber", "sourceType", "sourceId",
      "status", "expectedDate", "carrierName", "trackingNumber", "packageCount", "notes",
      "hasDiscrepancies", "items", "receivedBy", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *
  `;

  const result = await queryOne<WarehouseReceiving>(sql, [
    id, input.distributionWarehouseId, input.receiptNumber, input.sourceType, input.sourceId || null,
    'pending', input.expectedDate || null, input.carrierName || null, input.trackingNumber || null,
    input.packageCount || null, input.notes || null, false,
    input.items ? JSON.stringify(input.items) : null, input.receivedBy || null, now, now,
  ]);

  if (!result) throw new Error('Failed to create receiving record');
  return result;
}

export async function findById(id: string): Promise<WarehouseReceiving | null> {
  return queryOne<WarehouseReceiving>('SELECT * FROM "warehouseReceiving" WHERE "warehouseReceivingId" = $1', [id]);
}

export async function findByWarehouse(warehouseId: string, status?: string): Promise<WarehouseReceiving[]> {
  let sql = 'SELECT * FROM "warehouseReceiving" WHERE "distributionWarehouseId" = $1';
  const params: unknown[] = [warehouseId];
  if (status) {
    sql += ' AND "status" = $2';
    params.push(status);
  }
  sql += ' ORDER BY "createdAt" DESC';
  return (await query<WarehouseReceiving[]>(sql, params)) || [];
}

export async function updateStatus(id: string, status: string, receivedBy?: string): Promise<WarehouseReceiving | null> {
  const now = new Date();
  const fields: string[] = [`"status" = $1`, `"updatedAt" = $2`];
  const values: unknown[] = [status, now];

  if (status === 'completed') {
    fields.push(`"completedAt" = $${values.length + 1}`);
    fields.push(`"receivedDate" = $${values.length + 2}`);
    values.push(now, now);
  }
  if (receivedBy) {
    fields.push(`"receivedBy" = $${values.length + 1}`);
    values.push(receivedBy);
  }
  values.push(id);

  return queryOne<WarehouseReceiving>(`UPDATE "warehouseReceiving" SET ${fields.join(', ')} WHERE "warehouseReceivingId" = $${values.length} RETURNING *`, values);
}

export async function updateItems(id: string, items: Record<string, unknown>[], hasDiscrepancies: boolean): Promise<WarehouseReceiving | null> {
  const now = new Date();
  return queryOne<WarehouseReceiving>(
    `UPDATE "warehouseReceiving" SET "items" = $1, "hasDiscrepancies" = $2, "updatedAt" = $3 WHERE "warehouseReceivingId" = $4 RETURNING *`,
    [JSON.stringify(items), hasDiscrepancies, now, id],
  );
}

export default { create, findById, findByWarehouse, updateStatus, updateItems };
