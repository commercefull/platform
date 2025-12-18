/**
 * Shipping Method Repository
 * Manages shipping method data with CRUD operations
 */

import { query, queryOne } from '../../../libs/db';
import { Table, ShippingMethod } from '../../../libs/db/types';

export { ShippingMethod };

export type CreateShippingMethodInput = Omit<ShippingMethod, 'shippingMethodId' | 'createdAt' | 'updatedAt'>;
export type UpdateShippingMethodInput = Partial<Omit<ShippingMethod, 'shippingMethodId' | 'createdAt' | 'updatedAt'>>;

const TABLE = Table.ShippingMethod;

export async function findById(id: string): Promise<ShippingMethod | null> {
  return queryOne<ShippingMethod>(
    `SELECT * FROM "${TABLE}" WHERE "shippingMethodId" = $1`,
    [id]
  );
}

export async function findByCode(code: string): Promise<ShippingMethod | null> {
  return queryOne<ShippingMethod>(
    `SELECT * FROM "${TABLE}" WHERE "code" = $1`,
    [code]
  );
}

export async function findByCarrier(carrierId: string, activeOnly = false): Promise<ShippingMethod[]> {
  let sql = `SELECT * FROM "${TABLE}" WHERE "shippingCarrierId" = $1`;
  if (activeOnly) sql += ` AND "isActive" = true`;
  sql += ` ORDER BY "priority" ASC`;
  return (await query<ShippingMethod[]>(sql, [carrierId])) || [];
}

export async function findAll(activeOnly = false, displayOnFrontend = false): Promise<ShippingMethod[]> {
  let sql = `SELECT * FROM "${TABLE}" WHERE 1=1`;
  if (activeOnly) sql += ` AND "isActive" = true`;
  if (displayOnFrontend) sql += ` AND "displayOnFrontend" = true`;
  sql += ` ORDER BY "priority" ASC, "name" ASC`;
  return (await query<ShippingMethod[]>(sql)) || [];
}

export async function findDefault(): Promise<ShippingMethod | null> {
  return queryOne<ShippingMethod>(
    `SELECT * FROM "${TABLE}" WHERE "isDefault" = true AND "isActive" = true LIMIT 1`
  );
}

export async function create(input: CreateShippingMethodInput): Promise<ShippingMethod> {
  if (input.isDefault) {
    await query(`UPDATE "${TABLE}" SET "isDefault" = false, "updatedAt" = NOW() WHERE "isDefault" = true`);
  }

  const result = await queryOne<ShippingMethod>(
    `INSERT INTO "${TABLE}" (
      "shippingCarrierId", "name", "code", "description", "isActive", "isDefault", "serviceCode",
      "domesticInternational", "estimatedDeliveryDays", "handlingDays", "priority",
      "displayOnFrontend", "allowFreeShipping", "minWeight", "maxWeight", "minOrderValue",
      "maxOrderValue", "dimensionRestrictions", "shippingClass", "customFields", "createdBy"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING *`,
    [
      input.shippingCarrierId || null,
      input.name,
      input.code,
      input.description || null,
      input.isActive ?? true,
      input.isDefault ?? false,
      input.serviceCode || null,
      input.domesticInternational || 'both',
      input.estimatedDeliveryDays ? JSON.stringify(input.estimatedDeliveryDays) : null,
      input.handlingDays ?? 1,
      input.priority ?? 0,
      input.displayOnFrontend ?? true,
      input.allowFreeShipping ?? true,
      input.minWeight || null,
      input.maxWeight || null,
      input.minOrderValue || null,
      input.maxOrderValue || null,
      input.dimensionRestrictions ? JSON.stringify(input.dimensionRestrictions) : null,
      input.shippingClass || null,
      input.customFields ? JSON.stringify(input.customFields) : null,
      input.createdBy || null
    ]
  );

  if (!result) throw new Error('Failed to create shipping method');
  return result;
}

export async function update(id: string, input: UpdateShippingMethodInput): Promise<ShippingMethod | null> {
  if (input.isDefault === true) {
    await query(
      `UPDATE "${TABLE}" SET "isDefault" = false, "updatedAt" = NOW() WHERE "isDefault" = true AND "shippingMethodId" != $1`,
      [id]
    );
  }

  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  const jsonFields = ['estimatedDeliveryDays', 'dimensionRestrictions', 'customFields'];

  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      updateFields.push(`"${key}" = $${paramIndex++}`);
      values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
    }
  });

  if (updateFields.length === 0) return findById(id);

  updateFields.push(`"updatedAt" = NOW()`);
  values.push(id);

  return queryOne<ShippingMethod>(
    `UPDATE "${TABLE}" SET ${updateFields.join(', ')} WHERE "shippingMethodId" = $${paramIndex} RETURNING *`,
    values
  );
}

export async function activate(id: string): Promise<ShippingMethod | null> {
  return update(id, { isActive: true });
}

export async function deactivate(id: string): Promise<ShippingMethod | null> {
  return update(id, { isActive: false });
}

export async function deleteMethod(id: string): Promise<boolean> {
  const result = await queryOne<{ shippingMethodId: string }>(
    `DELETE FROM "${TABLE}" WHERE "shippingMethodId" = $1 RETURNING "shippingMethodId"`,
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
  findByCode,
  findByCarrier,
  findAll,
  findDefault,
  create,
  update,
  activate,
  deactivate,
  delete: deleteMethod,
  count
};
