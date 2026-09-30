/**
 * Warehouse Pick Pack Repository
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import { FailedToCreateWarehouseEntityError } from '../../domain/errors/WarehouseErrors';
import type { WarehousePickPack as DbWarehousePickPack } from '../../../../libs/db/types';
import type { WarehousePickPack, CreatePickPackInput } from '../../domain/repositories/WarehouseRepository';
export type { WarehousePickPack, CreatePickPackInput } from '../../domain/repositories/WarehouseRepository';

const optDate = (d: Date | null | undefined): Date | undefined => (d == null ? undefined : d instanceof Date ? d : new Date(d));

function mapToPickPack(row: DbWarehousePickPack): WarehousePickPack {
  return {
    ...row,
    orderId: row.orderId ?? undefined,
    fulfillmentId: row.fulfillmentId ?? undefined,
    items: (row.items as Record<string, unknown>[] | null) ?? undefined,
    assignedTo: row.assignedTo ?? undefined,
    pickingStartedAt: optDate(row.pickingStartedAt),
    pickingCompletedAt: optDate(row.pickingCompletedAt),
    packingStartedAt: optDate(row.packingStartedAt),
    packingCompletedAt: optDate(row.packingCompletedAt),
    notes: row.notes ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt),
  };
}





export async function create(input: CreatePickPackInput): Promise<WarehousePickPack> {
  const id = generateUUID();
  const now = new Date();

  const sql = `
    INSERT INTO "warehousePickPack" (
      "warehousePickPackId", "distributionWarehouseId", "pickPackNumber", "orderId", "fulfillmentId",
      "status", "items", "assignedTo", "notes", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const result = await queryOne<DbWarehousePickPack>(sql, [
    id,
    input.distributionWarehouseId,
    input.pickPackNumber,
    input.orderId || null,
    input.fulfillmentId || null,
    'pending',
    input.items ? JSON.stringify(input.items) : null,
    input.assignedTo || null,
    input.notes || null,
    now,
    now,
  ]);

  if (!result) throw new FailedToCreateWarehouseEntityError('Failed to create pick/pack record');
  return result ? mapToPickPack(result) : result;
}

export async function findById(id: string): Promise<WarehousePickPack | null> {
  const row = await queryOne<DbWarehousePickPack>('SELECT * FROM "warehousePickPack" WHERE "warehousePickPackId" = $1', [id]);
  return row ? mapToPickPack(row) : null;
}

export async function findByWarehouse(warehouseId: string, status?: string): Promise<WarehousePickPack[]> {
  let sql = 'SELECT * FROM "warehousePickPack" WHERE "distributionWarehouseId" = $1';
  const params: unknown[] = [warehouseId];
  if (status) {
    sql += ' AND "status" = $2';
    params.push(status);
  }
  sql += ' ORDER BY "createdAt" DESC';
  const rows = await query<DbWarehousePickPack[]>(sql, params);
  return (rows || []).map(mapToPickPack);
}

export async function startPicking(id: string): Promise<WarehousePickPack | null> {
  const now = new Date();
  const row = await queryOne<DbWarehousePickPack>(
    `UPDATE "warehousePickPack" SET "status" = 'picking', "pickingStartedAt" = $1, "updatedAt" = $2 WHERE "warehousePickPackId" = $3 AND "status" = 'pending' RETURNING *`,
    [now, now, id],
  );
  return row ? mapToPickPack(row) : null;
}

export async function completePicking(id: string): Promise<WarehousePickPack | null> {
  const now = new Date();
  const row = await queryOne<DbWarehousePickPack>(
    `UPDATE "warehousePickPack" SET "status" = 'picked', "pickingCompletedAt" = $1, "updatedAt" = $2 WHERE "warehousePickPackId" = $3 AND "status" = 'picking' RETURNING *`,
    [now, now, id],
  );
  return row ? mapToPickPack(row) : null;
}

export async function startPacking(id: string): Promise<WarehousePickPack | null> {
  const now = new Date();
  const row = await queryOne<DbWarehousePickPack>(
    `UPDATE "warehousePickPack" SET "status" = 'packing', "packingStartedAt" = $1, "updatedAt" = $2 WHERE "warehousePickPackId" = $3 AND "status" = 'picked' RETURNING *`,
    [now, now, id],
  );
  return row ? mapToPickPack(row) : null;
}

export async function completePacking(id: string): Promise<WarehousePickPack | null> {
  const now = new Date();
  const row = await queryOne<DbWarehousePickPack>(
    `UPDATE "warehousePickPack" SET "status" = 'packed', "packingCompletedAt" = $1, "updatedAt" = $2 WHERE "warehousePickPackId" = $3 AND "status" = 'packing' RETURNING *`,
    [now, now, id],
  );
  return row ? mapToPickPack(row) : null;
}

export async function assignTo(id: string, assignedTo: string): Promise<WarehousePickPack | null> {
  const now = new Date();
  const row = await queryOne<DbWarehousePickPack>(
    `UPDATE "warehousePickPack" SET "assignedTo" = $1, "updatedAt" = $2 WHERE "warehousePickPackId" = $3 RETURNING *`,
    [assignedTo, now, id],
  );
  return row ? mapToPickPack(row) : null;
}

export default { create, findById, findByWarehouse, startPicking, completePicking, startPacking, completePacking, assignTo };
