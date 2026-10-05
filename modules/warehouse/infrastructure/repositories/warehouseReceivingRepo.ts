/**
 * Warehouse Receiving Repository
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import { FailedToCreateWarehouseEntityError } from '../../domain/errors/WarehouseErrors';
import type { WarehouseReceiving as DbWarehouseReceiving } from '../../../../libs/db/types';
import type { WarehouseReceiving, CreateReceivingInput } from '../../domain/repositories/WarehouseRepository';
export type { WarehouseReceiving, CreateReceivingInput } from '../../domain/repositories/WarehouseRepository';

const optDate = (d: Date | null | undefined): Date | undefined => (d == null ? undefined : d instanceof Date ? d : new Date(d));

function mapToReceiving(row: DbWarehouseReceiving): WarehouseReceiving {
  return {
    ...row,
    sourceId: row.sourceId ?? undefined,
    expectedDate: optDate(row.expectedDate),
    receivedDate: optDate(row.receivedDate),
    carrierName: row.carrierName ?? undefined,
    trackingNumber: row.trackingNumber ?? undefined,
    packageCount: row.packageCount ?? undefined,
    notes: row.notes ?? undefined,
    items: (row.items as Record<string, unknown>[] | null) ?? undefined,
    completedAt: optDate(row.completedAt),
    receivedBy: row.receivedBy ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt),
  };
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

  const result = await queryOne<DbWarehouseReceiving>(sql, [
    id,
    input.distributionWarehouseId,
    input.receiptNumber,
    input.sourceType,
    input.sourceId || null,
    'pending',
    input.expectedDate || null,
    input.carrierName || null,
    input.trackingNumber || null,
    input.packageCount || null,
    input.notes || null,
    false,
    input.items ? JSON.stringify(input.items) : null,
    input.receivedBy || null,
    now,
    now,
  ]);

  if (!result) throw new FailedToCreateWarehouseEntityError('Failed to create receiving record');
  return result ? mapToReceiving(result) : result;
}

export async function findById(id: string): Promise<WarehouseReceiving | null> {
  const row = await queryOne<DbWarehouseReceiving>('SELECT * FROM "warehouseReceiving" WHERE "warehouseReceivingId" = $1', [id]);
  return row ? mapToReceiving(row) : null;
}

export async function findByWarehouse(warehouseId: string, status?: string): Promise<WarehouseReceiving[]> {
  let sql = 'SELECT * FROM "warehouseReceiving" WHERE "distributionWarehouseId" = $1';
  const params: unknown[] = [warehouseId];
  if (status) {
    sql += ' AND "status" = $2';
    params.push(status);
  }
  sql += ' ORDER BY "createdAt" DESC';
  const rows = await query<DbWarehouseReceiving[]>(sql, params);
  return (rows || []).map(mapToReceiving);
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

  const row = await queryOne<DbWarehouseReceiving>(
    `UPDATE "warehouseReceiving" SET ${fields.join(', ')} WHERE "warehouseReceivingId" = $${values.length} RETURNING *`,
    values,
  );
  return row ? mapToReceiving(row) : null;
}

export async function updateItems(
  id: string,
  items: Record<string, unknown>[],
  hasDiscrepancies: boolean,
): Promise<WarehouseReceiving | null> {
  const now = new Date();
  const row = await queryOne<DbWarehouseReceiving>(
    `UPDATE "warehouseReceiving" SET "items" = $1, "hasDiscrepancies" = $2, "updatedAt" = $3 WHERE "warehouseReceivingId" = $4 RETURNING *`,
    [JSON.stringify(items), hasDiscrepancies, now, id],
  );
  return row ? mapToReceiving(row) : null;
}

export default { create, findById, findByWarehouse, updateStatus, updateItems };
