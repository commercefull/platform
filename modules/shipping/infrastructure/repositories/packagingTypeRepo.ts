/**
 * Shipping Packaging Type Repository
 * Manages packaging type data with CRUD operations
 */

import { query, queryOne } from '../../../../libs/db';
import { Table, ShippingPackagingType } from '../../../../libs/db/types';
import { FailedToCreateShippingEntityError } from '../../domain/errors/ShippingErrors';
import type { ShippingPackagingType as DbShippingPackagingType } from '../../../../libs/db/types';

export { ShippingPackagingType };

export type CreateShippingPackagingTypeInput = Omit<ShippingPackagingType, 'shippingPackagingTypeId' | 'createdAt' | 'updatedAt'>;
export type UpdateShippingPackagingTypeInput = Partial<Omit<ShippingPackagingType, 'shippingPackagingTypeId' | 'createdAt' | 'updatedAt'>>;

const TABLE = Table.ShippingPackagingType;

async function findById(id: string): Promise<ShippingPackagingType | null> {
  return queryOne<DbShippingPackagingType>(`SELECT * FROM "${TABLE}" WHERE "shippingPackagingTypeId" = $1`, [id]);
}

async function findByCode(code: string): Promise<ShippingPackagingType | null> {
  return queryOne<DbShippingPackagingType>(`SELECT * FROM "${TABLE}" WHERE "code" = $1`, [code]);
}

async function findAll(activeOnly = false): Promise<ShippingPackagingType[]> {
  let sql = `SELECT * FROM "${TABLE}"`;
  if (activeOnly) sql += ` WHERE "isActive" = true`;
  sql += ` ORDER BY "volume" ASC`;
  return (await query<DbShippingPackagingType[]>(sql)) || [];
}

async function findDefault(): Promise<ShippingPackagingType | null> {
  return queryOne<DbShippingPackagingType>(`SELECT * FROM "${TABLE}" WHERE "isDefault" = true AND "isActive" = true LIMIT 1`);
}

async function findByMaxWeight(weight: number): Promise<ShippingPackagingType[]> {
  return (
    (await query<DbShippingPackagingType[]>(
      `SELECT * FROM "${TABLE}" WHERE "isActive" = true AND ("maxWeight" IS NULL OR "maxWeight" >= $1) ORDER BY "volume" ASC`,
      [weight],
    )) || []
  );
}

// `||`/`??`-style defaulting kept out of the create params to keep complexity low.
function fallback<T>(value: T | undefined | null, defaultValue: T): T {
  return value || defaultValue;
}
function nvl<T>(value: T | undefined | null, defaultValue: T): T {
  return value ?? defaultValue;
}

function packagingInsertValues(input: CreateShippingPackagingTypeInput): unknown[] {
  return [
    input.name,
    input.code,
    fallback(input.description, null),
    nvl(input.isActive, true),
    nvl(input.isDefault, false),
    fallback(input.weight, '0'),
    fallback(input.length, '0'),
    fallback(input.width, '0'),
    fallback(input.height, '0'),
    fallback(input.volume, '0'),
    fallback(input.maxWeight, null),
    fallback(input.maxItems, null),
    fallback(input.costCents, null),
    fallback(input.currencyCode, 'USD'),
    nvl(input.recyclable, false),
    fallback(input.imageUrl, null),
    fallback(input.validCarriers, null),
    fallback(input.createdBy, null),
  ];
}

async function create(input: CreateShippingPackagingTypeInput): Promise<ShippingPackagingType> {
  if (input.isDefault) {
    await query(`UPDATE "${TABLE}" SET "isDefault" = false, "updatedAt" = NOW() WHERE "isDefault" = true`);
  }

  const result = await queryOne<DbShippingPackagingType>(
    `INSERT INTO "${TABLE}" (
      "name", "code", "description", "isActive", "isDefault", "weight", "length", "width",
      "height", "volume", "maxWeight", "maxItems", "costCents", "currencyCode", "recyclable",
      "imageUrl", "validCarriers", "createdBy"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
    packagingInsertValues(input),
  );

  if (!result) throw new FailedToCreateShippingEntityError('Failed to create packaging type');
  return result;
}

async function update(id: string, input: UpdateShippingPackagingTypeInput): Promise<ShippingPackagingType | null> {
  if (input.isDefault === true) {
    await query(
      `UPDATE "${TABLE}" SET "isDefault" = false, "updatedAt" = NOW() WHERE "isDefault" = true AND "shippingPackagingTypeId" != $1`,
      [id],
    );
  }

  const updateFields: string[] = [];
  const values: unknown[] = [];
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

  return queryOne<DbShippingPackagingType>(
    `UPDATE "${TABLE}" SET ${updateFields.join(', ')} WHERE "shippingPackagingTypeId" = $${paramIndex} RETURNING *`,
    values,
  );
}

async function activate(id: string): Promise<ShippingPackagingType | null> {
  return update(id, { isActive: true });
}

async function deactivate(id: string): Promise<ShippingPackagingType | null> {
  return update(id, { isActive: false });
}

async function deletePackagingType(id: string): Promise<boolean> {
  const result = await queryOne<{ shippingPackagingTypeId: string }>(
    `DELETE FROM "${TABLE}" WHERE "shippingPackagingTypeId" = $1 RETURNING "shippingPackagingTypeId"`,
    [id],
  );
  return !!result;
}

async function count(activeOnly = false): Promise<number> {
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
  count,
};
