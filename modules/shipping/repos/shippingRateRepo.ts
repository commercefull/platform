/**
 * Shipping Rate Repository
 * Manages shipping rate data with CRUD operations
 */

import { query, queryOne } from '../../../libs/db';
import { Table, ShippingRate } from '../../../libs/db/types';

export { ShippingRate };

export type CreateShippingRateInput = Omit<ShippingRate, 'shippingRateId' | 'createdAt' | 'updatedAt'>;
export type UpdateShippingRateInput = Partial<
  Omit<ShippingRate, 'shippingRateId' | 'shippingZoneId' | 'shippingMethodId' | 'createdAt' | 'updatedAt'>
>;

const TABLE = Table.ShippingRate;

export async function findById(id: string): Promise<ShippingRate | null> {
  return queryOne<ShippingRate>(`SELECT * FROM "${TABLE}" WHERE "shippingRateId" = $1`, [id]);
}

export async function findByZone(zoneId: string, activeOnly = false): Promise<ShippingRate[]> {
  let sql = `SELECT * FROM "${TABLE}" WHERE "shippingZoneId" = $1`;
  if (activeOnly) {
    sql += ` AND "isActive" = true AND ("validFrom" IS NULL OR "validFrom" <= NOW()) AND ("validTo" IS NULL OR "validTo" >= NOW())`;
  }
  sql += ` ORDER BY "priority" ASC`;
  return (await query<ShippingRate[]>(sql, [zoneId])) || [];
}

export async function findByMethod(methodId: string, activeOnly = false): Promise<ShippingRate[]> {
  let sql = `SELECT * FROM "${TABLE}" WHERE "shippingMethodId" = $1`;
  if (activeOnly) {
    sql += ` AND "isActive" = true AND ("validFrom" IS NULL OR "validFrom" <= NOW()) AND ("validTo" IS NULL OR "validTo" >= NOW())`;
  }
  sql += ` ORDER BY "priority" ASC`;
  return (await query<ShippingRate[]>(sql, [methodId])) || [];
}

export async function findByZoneAndMethod(zoneId: string, methodId: string): Promise<ShippingRate | null> {
  return queryOne<ShippingRate>(
    `SELECT * FROM "${TABLE}" WHERE "shippingZoneId" = $1 AND "shippingMethodId" = $2 AND "isActive" = true ORDER BY "priority" ASC LIMIT 1`,
    [zoneId, methodId],
  );
}

export async function findActive(zoneId?: string, methodId?: string): Promise<ShippingRate[]> {
  let sql = `SELECT * FROM "${TABLE}" WHERE "isActive" = true`;
  const params: any[] = [];

  if (zoneId) {
    sql += ` AND "shippingZoneId" = $${params.length + 1}`;
    params.push(zoneId);
  }
  if (methodId) {
    sql += ` AND "shippingMethodId" = $${params.length + 1}`;
    params.push(methodId);
  }

  sql += ` AND ("validFrom" IS NULL OR "validFrom" <= NOW()) AND ("validTo" IS NULL OR "validTo" >= NOW())`;
  sql += ` ORDER BY "priority" ASC`;

  return (await query<ShippingRate[]>(sql, params)) || [];
}

export async function create(input: CreateShippingRateInput): Promise<ShippingRate> {
  const result = await queryOne<ShippingRate>(
    `INSERT INTO "${TABLE}" (
      "shippingZoneId", "shippingMethodId", "name", "description", "isActive", "rateType", "baseRate",
      "perItemRate", "freeThreshold", "rateMatrix", "minRate", "maxRate", "currency",
      "taxable", "priority", "validFrom", "validTo", "conditions", "createdBy"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
    [
      input.shippingZoneId,
      input.shippingMethodId,
      input.name || null,
      input.description || null,
      input.isActive ?? true,
      input.rateType,
      input.baseRate,
      input.perItemRate || '0',
      input.freeThreshold || null,
      input.rateMatrix ? JSON.stringify(input.rateMatrix) : null,
      input.minRate || null,
      input.maxRate || null,
      input.currency || 'USD',
      input.taxable ?? true,
      input.priority ?? 0,
      input.validFrom || null,
      input.validTo || null,
      input.conditions ? JSON.stringify(input.conditions) : null,
      input.createdBy || null,
    ],
  );

  if (!result) throw new Error('Failed to create shipping rate');
  return result;
}

export async function update(id: string, input: UpdateShippingRateInput): Promise<ShippingRate | null> {
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  const jsonFields = ['rateMatrix', 'conditions'];

  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      updateFields.push(`"${key}" = $${paramIndex++}`);
      values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
    }
  });

  if (updateFields.length === 0) return findById(id);

  updateFields.push(`"updatedAt" = NOW()`);
  values.push(id);

  return queryOne<ShippingRate>(
    `UPDATE "${TABLE}" SET ${updateFields.join(', ')} WHERE "shippingRateId" = $${paramIndex} RETURNING *`,
    values,
  );
}

export async function activate(id: string): Promise<ShippingRate | null> {
  return update(id, { isActive: true });
}

export async function deactivate(id: string): Promise<ShippingRate | null> {
  return update(id, { isActive: false });
}

export async function deleteRate(id: string): Promise<boolean> {
  const result = await queryOne<{ shippingRateId: string }>(
    `DELETE FROM "${TABLE}" WHERE "shippingRateId" = $1 RETURNING "shippingRateId"`,
    [id],
  );
  return !!result;
}

export async function count(zoneId?: string, methodId?: string): Promise<number> {
  let sql = `SELECT COUNT(*) as count FROM "${TABLE}" WHERE 1=1`;
  const params: any[] = [];

  if (zoneId) {
    sql += ` AND "shippingZoneId" = $${params.length + 1}`;
    params.push(zoneId);
  }
  if (methodId) {
    sql += ` AND "shippingMethodId" = $${params.length + 1}`;
    params.push(methodId);
  }

  const result = await queryOne<{ count: string }>(sql, params);
  return result ? parseInt(result.count, 10) : 0;
}

/**
 * Calculate shipping rate for an order
 */
export function calculateRate(rate: ShippingRate, orderTotal: number, itemCount: number, weight?: number): number {
  if (rate.rateType === 'free') return 0;

  // Check free threshold
  if (rate.freeThreshold && orderTotal >= parseFloat(rate.freeThreshold)) {
    return 0;
  }

  let calculatedRate = parseFloat(rate.baseRate);

  switch (rate.rateType) {
    case 'flat':
      break;
    case 'itemBased':
      calculatedRate += parseFloat(rate.perItemRate || '0') * itemCount;
      break;
    case 'priceBased':
      if (rate.rateMatrix) {
        // Use rate matrix for price-based calculation
        const matrix = typeof rate.rateMatrix === 'string' ? JSON.parse(rate.rateMatrix) : rate.rateMatrix;
        for (const tier of matrix.tiers || []) {
          if (orderTotal >= tier.min && orderTotal < tier.max) {
            calculatedRate = tier.rate;
            break;
          }
        }
      }
      break;
    case 'weightBased':
      if (weight && rate.rateMatrix) {
        const matrix = typeof rate.rateMatrix === 'string' ? JSON.parse(rate.rateMatrix) : rate.rateMatrix;
        for (const tier of matrix.tiers || []) {
          if (weight >= tier.min && weight < tier.max) {
            calculatedRate = tier.rate;
            break;
          }
        }
      }
      break;
  }

  // Apply min/max constraints
  if (rate.minRate) calculatedRate = Math.max(calculatedRate, parseFloat(rate.minRate));
  if (rate.maxRate) calculatedRate = Math.min(calculatedRate, parseFloat(rate.maxRate));

  return calculatedRate;
}

export default {
  findById,
  findByZone,
  findByMethod,
  findByZoneAndMethod,
  findActive,
  create,
  update,
  activate,
  deactivate,
  delete: deleteRate,
  count,
  calculateRate,
};
