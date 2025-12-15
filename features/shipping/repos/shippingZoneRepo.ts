/**
 * Shipping Zone Repository
 * Manages shipping zone data with CRUD operations
 */

import { query, queryOne } from '../../../libs/db';
import { Table, ShippingZone } from '../../../libs/db/types';

export { ShippingZone };

export type CreateShippingZoneInput = Omit<ShippingZone, 'shippingZoneId' | 'createdAt' | 'updatedAt'>;
export type UpdateShippingZoneInput = Partial<Omit<ShippingZone, 'shippingZoneId' | 'createdAt' | 'updatedAt'>>;

const TABLE = Table.ShippingZone;

export async function findById(id: string): Promise<ShippingZone | null> {
  return queryOne<ShippingZone>(
    `SELECT * FROM "${TABLE}" WHERE "shippingZoneId" = $1`,
    [id]
  );
}

export async function findByName(name: string): Promise<ShippingZone | null> {
  return queryOne<ShippingZone>(
    `SELECT * FROM "${TABLE}" WHERE "name" = $1`,
    [name]
  );
}

export async function findAll(activeOnly = false): Promise<ShippingZone[]> {
  let sql = `SELECT * FROM "${TABLE}"`;
  if (activeOnly) sql += ` WHERE "isActive" = true`;
  sql += ` ORDER BY "priority" ASC, "name" ASC`;
  return (await query<ShippingZone[]>(sql)) || [];
}

export async function findByLocationType(
  locationType: ShippingZone['locationType'],
  activeOnly = false
): Promise<ShippingZone[]> {
  let sql = `SELECT * FROM "${TABLE}" WHERE "locationType" = $1`;
  if (activeOnly) sql += ` AND "isActive" = true`;
  sql += ` ORDER BY "priority" ASC`;
  return (await query<ShippingZone[]>(sql, [locationType])) || [];
}

export async function findByLocation(country: string, state?: string): Promise<ShippingZone[]> {
  const sql = `
    SELECT * FROM "${TABLE}" 
    WHERE "isActive" = true 
    AND ("locations" @> $1::jsonb OR "locations" @> $2::jsonb)
    AND NOT ("excludedLocations" @> $1::jsonb OR "excludedLocations" @> $2::jsonb)
    ORDER BY "priority" ASC
  `;
  return (await query<ShippingZone[]>(sql, [
    JSON.stringify([country]),
    state ? JSON.stringify([state]) : JSON.stringify([])
  ])) || [];
}

export async function create(input: CreateShippingZoneInput): Promise<ShippingZone> {
  const result = await queryOne<ShippingZone>(
    `INSERT INTO "${TABLE}" (
      "name", "description", "isActive", "priority", "locationType", "locations",
      "excludedLocations", "createdBy"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      input.name,
      input.description || null,
      input.isActive ?? true,
      input.priority ?? 0,
      input.locationType || 'country',
      JSON.stringify(input.locations),
      input.excludedLocations ? JSON.stringify(input.excludedLocations) : null,
      input.createdBy || null
    ]
  );

  if (!result) throw new Error('Failed to create shipping zone');
  return result;
}

export async function update(id: string, input: UpdateShippingZoneInput): Promise<ShippingZone | null> {
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  const jsonFields = ['locations', 'excludedLocations'];

  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      updateFields.push(`"${key}" = $${paramIndex++}`);
      values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
    }
  });

  if (updateFields.length === 0) return findById(id);

  updateFields.push(`"updatedAt" = NOW()`);
  values.push(id);

  return queryOne<ShippingZone>(
    `UPDATE "${TABLE}" SET ${updateFields.join(', ')} WHERE "shippingZoneId" = $${paramIndex} RETURNING *`,
    values
  );
}

export async function activate(id: string): Promise<ShippingZone | null> {
  return update(id, { isActive: true });
}

export async function deactivate(id: string): Promise<ShippingZone | null> {
  return update(id, { isActive: false });
}

export async function deleteZone(id: string): Promise<boolean> {
  const result = await queryOne<{ shippingZoneId: string }>(
    `DELETE FROM "${TABLE}" WHERE "shippingZoneId" = $1 RETURNING "shippingZoneId"`,
    [id]
  );
  return !!result;
}

export async function count(activeOnly = false): Promise<number> {
  let sql = `SELECT COUNT(*) as count FROM "${TABLE}"`;
  if (activeOnly) sql += ` WHERE "isActive" = true`;
  const result = await queryOne<{ count: string }>(sql);
  return result ? parseInt(result.count, 10) : 0;
}

export default {
  findById,
  findByName,
  findAll,
  findByLocationType,
  findByLocation,
  create,
  update,
  activate,
  deactivate,
  delete: deleteZone,
  count
};
