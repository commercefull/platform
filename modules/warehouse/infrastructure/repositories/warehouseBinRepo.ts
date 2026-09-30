/**
 * Warehouse Bin Repository
 * CRUD operations for warehouse bins (distributionWarehouseBin table)
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import { FailedToCreateWarehouseEntityError } from '../../domain/errors/WarehouseErrors';
import type { DistributionWarehouseBin as DbDistributionWarehouseBin } from '../../../../libs/db/types';
import type { WarehouseBin, CreateBinInput, UpdateBinInput } from '../../domain/repositories/WarehouseRepository';
export type { WarehouseBin, CreateBinInput, UpdateBinInput } from '../../domain/repositories/WarehouseRepository';

const num = (v: string | number | null | undefined): number | undefined => (v == null ? undefined : Number(v));

function mapToBin(row: DbDistributionWarehouseBin): WarehouseBin {
  return {
    ...row,
    height: num(row.height),
    width: num(row.width),
    depth: num(row.depth),
    maxVolume: num(row.maxVolume),
    maxWeight: num(row.maxWeight),
    priority: row.priority ?? 0,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt),
  };
}







export async function createBin(input: CreateBinInput): Promise<WarehouseBin> {
  const id = generateUUID();
  const now = new Date();

  const sql = `
    INSERT INTO "distributionWarehouseBin" (
      "distributionWarehouseBinId", "distributionWarehouseId", "locationCode",
      "isActive", "binType", "height", "width", "depth", "maxVolume", "maxWeight",
      "isPickable", "isReceivable", "isMixed", "priority", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *
  `;

  const result = await queryOne<DbDistributionWarehouseBin>(sql, [
    id,
    input.distributionWarehouseId,
    input.locationCode,
    input.isActive ?? true,
    input.binType,
    input.height ?? null,
    input.width ?? null,
    input.depth ?? null,
    input.maxVolume ?? null,
    input.maxWeight ?? null,
    input.isPickable ?? true,
    input.isReceivable ?? true,
    input.isMixed ?? true,
    input.priority ?? 0,
    now,
    now,
  ]);

  if (!result) throw new FailedToCreateWarehouseEntityError('Failed to create warehouse bin');
  return result ? mapToBin(result) : result;
}

export async function findBinById(binId: string): Promise<WarehouseBin | null> {
  const row = await queryOne<DbDistributionWarehouseBin>('SELECT * FROM "distributionWarehouseBin" WHERE "distributionWarehouseBinId" = $1', [binId]);
  return row ? mapToBin(row) : null;
}

export async function findBinsByWarehouse(warehouseId: string): Promise<WarehouseBin[]> {
  const result = await query<DbDistributionWarehouseBin[]>(
    'SELECT * FROM "distributionWarehouseBin" WHERE "distributionWarehouseId" = $1 ORDER BY "priority" ASC, "locationCode" ASC',
    [warehouseId],
  );
  return (result || []).map(mapToBin);
}

export async function updateBin(binId: string, input: UpdateBinInput): Promise<WarehouseBin | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.binType !== undefined) {
    fields.push(`"binType" = $${paramIndex++}`);
    values.push(input.binType);
  }
  if (input.isActive !== undefined) {
    fields.push(`"isActive" = $${paramIndex++}`);
    values.push(input.isActive);
  }
  if (input.height !== undefined) {
    fields.push(`"height" = $${paramIndex++}`);
    values.push(input.height);
  }
  if (input.width !== undefined) {
    fields.push(`"width" = $${paramIndex++}`);
    values.push(input.width);
  }
  if (input.depth !== undefined) {
    fields.push(`"depth" = $${paramIndex++}`);
    values.push(input.depth);
  }
  if (input.maxVolume !== undefined) {
    fields.push(`"maxVolume" = $${paramIndex++}`);
    values.push(input.maxVolume);
  }
  if (input.maxWeight !== undefined) {
    fields.push(`"maxWeight" = $${paramIndex++}`);
    values.push(input.maxWeight);
  }
  if (input.isPickable !== undefined) {
    fields.push(`"isPickable" = $${paramIndex++}`);
    values.push(input.isPickable);
  }
  if (input.isReceivable !== undefined) {
    fields.push(`"isReceivable" = $${paramIndex++}`);
    values.push(input.isReceivable);
  }
  if (input.isMixed !== undefined) {
    fields.push(`"isMixed" = $${paramIndex++}`);
    values.push(input.isMixed);
  }
  if (input.priority !== undefined) {
    fields.push(`"priority" = $${paramIndex++}`);
    values.push(input.priority);
  }

  if (fields.length === 0) return findBinById(binId);

  fields.push(`"updatedAt" = $${paramIndex++}`);
  values.push(new Date());
  values.push(binId);

  const sql = `UPDATE "distributionWarehouseBin" SET ${fields.join(', ')} WHERE "distributionWarehouseBinId" = $${paramIndex} RETURNING *`;
  const row = await queryOne<DbDistributionWarehouseBin>(sql, values);
  return row ? mapToBin(row) : null;
}

export async function deleteBin(binId: string): Promise<boolean> {
  await query('DELETE FROM "distributionWarehouseBin" WHERE "distributionWarehouseBinId" = $1', [binId]);
  return true;
}

export default { createBin, findBinById, findBinsByWarehouse, updateBin, deleteBin };
