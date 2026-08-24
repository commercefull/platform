/**
 * Warehouse Pick Pack Repository
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import { FailedToCreateWarehouseEntityError } from '../../domain/errors/WarehouseErrors';

export interface WarehousePickPack {
  warehousePickPackId: string;
  distributionWarehouseId: string;
  pickPackNumber: string;
  orderId?: string;
  fulfillmentId?: string;
  status: string;
  items?: Record<string, unknown>[];
  assignedTo?: string;
  pickingStartedAt?: Date;
  pickingCompletedAt?: Date;
  packingStartedAt?: Date;
  packingCompletedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePickPackInput {
  distributionWarehouseId: string;
  pickPackNumber: string;
  orderId?: string;
  fulfillmentId?: string;
  items?: Record<string, unknown>[];
  assignedTo?: string;
  notes?: string;
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

  const result = await queryOne<WarehousePickPack>(sql, [
    id, input.distributionWarehouseId, input.pickPackNumber,
    input.orderId || null, input.fulfillmentId || null,
    'pending', input.items ? JSON.stringify(input.items) : null,
    input.assignedTo || null, input.notes || null, now, now,
  ]);

  if (!result) throw new FailedToCreateWarehouseEntityError('Failed to create pick/pack record');
  return result;
}

export async function findById(id: string): Promise<WarehousePickPack | null> {
  return queryOne<WarehousePickPack>('SELECT * FROM "warehousePickPack" WHERE "warehousePickPackId" = $1', [id]);
}

export async function findByWarehouse(warehouseId: string, status?: string): Promise<WarehousePickPack[]> {
  let sql = 'SELECT * FROM "warehousePickPack" WHERE "distributionWarehouseId" = $1';
  const params: unknown[] = [warehouseId];
  if (status) {
    sql += ' AND "status" = $2';
    params.push(status);
  }
  sql += ' ORDER BY "createdAt" DESC';
  return (await query<WarehousePickPack[]>(sql, params)) || [];
}

export async function startPicking(id: string): Promise<WarehousePickPack | null> {
  const now = new Date();
  return queryOne<WarehousePickPack>(
    `UPDATE "warehousePickPack" SET "status" = 'picking', "pickingStartedAt" = $1, "updatedAt" = $2 WHERE "warehousePickPackId" = $3 AND "status" = 'pending' RETURNING *`,
    [now, now, id],
  );
}

export async function completePicking(id: string): Promise<WarehousePickPack | null> {
  const now = new Date();
  return queryOne<WarehousePickPack>(
    `UPDATE "warehousePickPack" SET "status" = 'picked', "pickingCompletedAt" = $1, "updatedAt" = $2 WHERE "warehousePickPackId" = $3 AND "status" = 'picking' RETURNING *`,
    [now, now, id],
  );
}

export async function startPacking(id: string): Promise<WarehousePickPack | null> {
  const now = new Date();
  return queryOne<WarehousePickPack>(
    `UPDATE "warehousePickPack" SET "status" = 'packing', "packingStartedAt" = $1, "updatedAt" = $2 WHERE "warehousePickPackId" = $3 AND "status" = 'picked' RETURNING *`,
    [now, now, id],
  );
}

export async function completePacking(id: string): Promise<WarehousePickPack | null> {
  const now = new Date();
  return queryOne<WarehousePickPack>(
    `UPDATE "warehousePickPack" SET "status" = 'packed', "packingCompletedAt" = $1, "updatedAt" = $2 WHERE "warehousePickPackId" = $3 AND "status" = 'packing' RETURNING *`,
    [now, now, id],
  );
}

export async function assignTo(id: string, assignedTo: string): Promise<WarehousePickPack | null> {
  const now = new Date();
  return queryOne<WarehousePickPack>(
    `UPDATE "warehousePickPack" SET "assignedTo" = $1, "updatedAt" = $2 WHERE "warehousePickPackId" = $3 RETURNING *`,
    [assignedTo, now, id],
  );
}

export default { create, findById, findByWarehouse, startPicking, completePicking, startPacking, completePacking, assignTo };
