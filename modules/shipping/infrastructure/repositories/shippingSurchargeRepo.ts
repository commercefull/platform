/**
 * Shipping Surcharge Repository
 * Read operations for shipping surcharges (Epic D).
 */

import { query, queryOne } from '../../../../libs/db';
import { Table, ShippingSurcharge } from '../../../../libs/db/types';

export { ShippingSurcharge };

const TABLE = Table.ShippingSurcharge;

/**
 * Find all active surcharges for a given shipping rate.
 */
export async function findByRateId(shippingRateId: string, activeOnly = true): Promise<ShippingSurcharge[]> {
  let sql = `SELECT * FROM "${TABLE}" WHERE "shippingRateId" = $1`;
  const params: unknown[] = [shippingRateId];
  if (activeOnly) {
    sql += ` AND "isActive" = true`;
  }
  sql += ` ORDER BY "type" ASC`;
  return (await query<ShippingSurcharge[]>(sql, params)) || [];
}

/**
 * Find surcharges by type for a given shipping rate.
 */
export async function findByRateIdAndType(
  shippingRateId: string,
  type: ShippingSurcharge['type'],
  activeOnly = true,
): Promise<ShippingSurcharge[]> {
  let sql = `SELECT * FROM "${TABLE}" WHERE "shippingRateId" = $1 AND "type" = $2`;
  const params: unknown[] = [shippingRateId, type];
  if (activeOnly) {
    sql += ` AND "isActive" = true`;
  }
  return (await query<ShippingSurcharge[]>(sql, params)) || [];
}

/**
 * Find a single surcharge by id.
 */
export async function findById(shippingSurchargeId: string): Promise<ShippingSurcharge | null> {
  return queryOne<ShippingSurcharge>(`SELECT * FROM "${TABLE}" WHERE "shippingSurchargeId" = $1`, [shippingSurchargeId]);
}

/**
 * Create a new surcharge.
 */
export type CreateShippingSurchargeInput = Omit<ShippingSurcharge, 'shippingSurchargeId' | 'createdAt' | 'updatedAt'>;

export async function create(input: CreateShippingSurchargeInput): Promise<ShippingSurcharge> {
  const result = await queryOne<ShippingSurcharge>(
    `INSERT INTO "${TABLE}" (
      "shippingRateId", "type", "calculationType", "value", "conditions", "isActive"
    ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      input.shippingRateId,
      input.type,
      input.calculationType,
      input.value,
      input.conditions ? JSON.stringify(input.conditions) : null,
      input.isActive,
    ],
  );
  if (!result) throw new Error('Failed to create shipping surcharge');
  return result;
}

/**
 * Update an existing surcharge.
 */
export type UpdateShippingSurchargeInput = Partial<Omit<ShippingSurcharge, 'shippingSurchargeId' | 'createdAt' | 'updatedAt'>>;

export async function update(shippingSurchargeId: string, input: UpdateShippingSurchargeInput): Promise<ShippingSurcharge | null> {
  const sets: string[] = [];
  const params: unknown[] = [shippingSurchargeId];
  let paramIndex = 2;

  if (input.type !== undefined) {
    sets.push(`"type" = $${paramIndex++}`);
    params.push(input.type);
  }
  if (input.calculationType !== undefined) {
    sets.push(`"calculationType" = $${paramIndex++}`);
    params.push(input.calculationType);
  }
  if (input.value !== undefined) {
    sets.push(`"value" = $${paramIndex++}`);
    params.push(input.value);
  }
  if (input.conditions !== undefined) {
    sets.push(`"conditions" = $${paramIndex++}`);
    params.push(input.conditions ? JSON.stringify(input.conditions) : null);
  }
  if (input.isActive !== undefined) {
    sets.push(`"isActive" = $${paramIndex}`);
    params.push(input.isActive);
  }

  if (sets.length === 0) return findById(shippingSurchargeId);

  sets.push(`"updatedAt" = NOW()`);

  return queryOne<ShippingSurcharge>(`UPDATE "${TABLE}" SET ${sets.join(', ')} WHERE "shippingSurchargeId" = $1 RETURNING *`, params);
}

/**
 * Delete a surcharge.
 */
export async function remove(shippingSurchargeId: string): Promise<boolean> {
  const result = await queryOne<{ count: string }>(`DELETE FROM "${TABLE}" WHERE "shippingSurchargeId" = $1 RETURNING 1 AS count`, [
    shippingSurchargeId,
  ]);
  return !!result;
}

export default {
  findByRateId,
  findByRateIdAndType,
  findById,
  create,
  update,
  delete: remove,
};
