/**
 * Shipping Packaging Type Repository
 * Manages packaging type data with CRUD operations
 */

import { query, queryOne } from '../../../libs/db';
import { Table, ShippingPackagingType } from '../../../libs/db/types';

export { ShippingPackagingType };

export type CreateShippingPackagingTypeInput = Omit<ShippingPackagingType, 'shippingPackagingTypeId' | 'createdAt' | 'updatedAt'>;
export type UpdateShippingPackagingTypeInput = Partial<Omit<ShippingPackagingType, 'shippingPackagingTypeId' | 'createdAt' | 'updatedAt'>>;

const TABLE = Table.ShippingPackagingType;

export async function findById(id: string): Promise<ShippingPackagingType | null> {
  return queryOne<ShippingPackagingType>(
    `SELECT * FROM "${TABLE}" WHERE "shippingPackagingTypeId" = $1`,
    [id]
  );
}

export async function findByCode(code: string): Promise<ShippingPackagingType | null> {
  return queryOne<ShippingPackagingType>(
    `SELECT * FROM "${TABLE}" WHERE "code" = $1`,
    [code]
  );
}

export async function findAll(activeOnly = false): Promise<ShippingPackagingType[]> {
  let sql = `SELECT * FROM "${TABLE}"`;
  if (activeOnly) sql += ` WHERE "isActive" = true`;
  sql += ` ORDER BY "volume" ASC`;
  return (await query<ShippingPackagingType[]>(sql)) || [];
}

export async function findDefault(): Promise<ShippingPackagingType | null> {
  return queryOne<ShippingPackagingType>(
    `SELECT * FROM "${TABLE}" WHERE "isDefault" = true AND "isActive" = true LIMIT 1`
  );
}

export async function findByMaxWeight(weight: number): Promise<ShippingPackagingType[]> {
  return (await query<ShippingPackagingType[]>(
    `SELECT * FROM "${TABLE}" WHERE "isActive" = true AND ("maxWeight" IS NULL OR "maxWeight" >= $1) ORDER BY "volume" ASC`,
    [weight]
  )) || [];
}

export async function create(input: CreateShippingPackagingTypeInput): Promise<ShippingPackagingType> {
  if (input.isDefault) {
    await query(`UPDATE "${TABLE}" SET "isDefault" = false, "updatedAt" = NOW() WHERE "isDefault" = true`);
  }

  const result = await queryOne<ShippingPackagingType>(
    `INSERT INTO "${TABLE}" (
      "name", "code", "description", "isActive", "isDefault", "weight", "length", "width",
      "height", "volume", "maxWeight", "maxItems", "cost", "currency", "recyclable",
      "imageUrl", "validCarriers", "createdBy"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
    [
      input.name,
      input.code,
      input.description || null,
      input.isActive ?? true,
      input.isDefault ?? false,
      input.weight || '0',
      input.length,
      input.width,
      input.height,
      input.volume,
      input.maxWeight || null,
      input.maxItems || null,
      input.cost || null,
      input.currency || 'USD',
      input.recyclable ?? false,
      input.imageUrl || null,
      input.validCarriers || null,
      input.createdBy || null
    ]
  );

  if (!result) throw new Error('Failed to create packaging type');
  return result;
}

export async function update(id: string, input: UpdateShippingPackagingTypeInput): Promise<ShippingPackagingType | null> {
  if (input.isDefault === true) {
    await query(
      `UPDATE "${TABLE}" SET "isDefault" = false, "updatedAt" = NOW() WHERE "isDefault" = true AND "shippingPackagingTypeId" != $1`,
      [id]
    );
  }

  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      updateFields.push(`"${key}" = $${paramIndex++}`);
      values.push(value);
    }
  });

  if (updateFields.length === 0) return findById(id);

  updateFields.push(`"updatedAt" = NOW()`);
  values.push(id);

  return queryOne<ShippingPackagingType>(
    `UPDATE "${TABLE}" SET ${updateFields.join(', ')} WHERE "shippingPackagingTypeId" = $${paramIndex} RETURNING *`,
    values
  );
}

export async function activate(id: string): Promise<ShippingPackagingType | null> {
  return update(id, { isActive: true });
}

export async function deactivate(id: string): Promise<ShippingPackagingType | null> {
  return update(id, { isActive: false });
}

export async function deletePackagingType(id: string): Promise<boolean> {
  const result = await queryOne<{ shippingPackagingTypeId: string }>(
    `DELETE FROM "${TABLE}" WHERE "shippingPackagingTypeId" = $1 RETURNING "shippingPackagingTypeId"`,
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
  findAll,
  findDefault,
  findByMaxWeight,
  create,
  update,
  activate,
  deactivate,
  delete: deletePackagingType,
  count
};
