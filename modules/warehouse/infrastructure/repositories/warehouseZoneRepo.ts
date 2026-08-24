/**
 * Warehouse Zone Repository
 * CRUD operations for warehouse zones
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import { FailedToCreateWarehouseEntityError } from '../../domain/errors/WarehouseErrors';

export interface WarehouseZone {
  distributionWarehouseZoneId: string;
  distributionWarehouseId: string;
  name: string;
  code: string;
  description?: string;
  zoneType: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateZoneInput {
  distributionWarehouseId: string;
  name: string;
  code: string;
  description?: string;
  zoneType?: string;
  isActive?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export type UpdateZoneInput = Partial<Omit<CreateZoneInput, 'distributionWarehouseId' | 'code'>>;

export async function createZone(input: CreateZoneInput): Promise<WarehouseZone> {
  const id = generateUUID();
  const now = new Date();

  const sql = `
    INSERT INTO "distributionWarehouseZone" (
      "distributionWarehouseZoneId", "distributionWarehouseId", "name", "code",
      "description", "zoneType", "isActive", "sortOrder", "metadata", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const result = await queryOne<WarehouseZone>(sql, [
    id,
    input.distributionWarehouseId,
    input.name,
    input.code,
    input.description || null,
    input.zoneType || 'storage',
    input.isActive ?? true,
    input.sortOrder ?? 0,
    input.metadata ? JSON.stringify(input.metadata) : null,
    now,
    now,
  ]);

  if (!result) throw new FailedToCreateWarehouseEntityError('Failed to create warehouse zone');
  return result;
}

export async function findZoneById(zoneId: string): Promise<WarehouseZone | null> {
  return queryOne<WarehouseZone>('SELECT * FROM "distributionWarehouseZone" WHERE "distributionWarehouseZoneId" = $1', [zoneId]);
}

export async function findZonesByWarehouse(warehouseId: string): Promise<WarehouseZone[]> {
  const result = await query<WarehouseZone[]>('SELECT * FROM "distributionWarehouseZone" WHERE "distributionWarehouseId" = $1 ORDER BY "sortOrder" ASC, "name" ASC', [warehouseId]);
  return result || [];
}

export async function updateZone(zoneId: string, input: UpdateZoneInput): Promise<WarehouseZone | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) { fields.push(`"name" = $${paramIndex++}`); values.push(input.name); }
  if (input.description !== undefined) { fields.push(`"description" = $${paramIndex++}`); values.push(input.description); }
  if (input.zoneType !== undefined) { fields.push(`"zoneType" = $${paramIndex++}`); values.push(input.zoneType); }
  if (input.isActive !== undefined) { fields.push(`"isActive" = $${paramIndex++}`); values.push(input.isActive); }
  if (input.sortOrder !== undefined) { fields.push(`"sortOrder" = $${paramIndex++}`); values.push(input.sortOrder); }
  if (input.metadata !== undefined) { fields.push(`"metadata" = $${paramIndex++}`); values.push(JSON.stringify(input.metadata)); }

  if (fields.length === 0) return findZoneById(zoneId);

  fields.push(`"updatedAt" = $${paramIndex++}`);
  values.push(new Date());
  values.push(zoneId);

  const sql = `UPDATE "distributionWarehouseZone" SET ${fields.join(', ')} WHERE "distributionWarehouseZoneId" = $${paramIndex} RETURNING *`;
  return queryOne<WarehouseZone>(sql, values);
}

export async function deleteZone(zoneId: string): Promise<boolean> {
  await query('DELETE FROM "distributionWarehouseZone" WHERE "distributionWarehouseZoneId" = $1', [zoneId]);
  return true;
}

export default { createZone, findZoneById, findZonesByWarehouse, updateZone, deleteZone };
