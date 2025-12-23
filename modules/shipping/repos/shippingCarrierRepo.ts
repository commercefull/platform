/**
 * Shipping Carrier Repository
 * Manages shipping carrier data with CRUD operations
 */

import { query, queryOne } from '../../../libs/db';
import { Table, ShippingCarrier } from '../../../libs/db/types';

// Re-export the type for convenience
export { ShippingCarrier };

export type CreateShippingCarrierInput = Omit<ShippingCarrier, 'shippingCarrierId' | 'createdAt' | 'updatedAt'>;
export type UpdateShippingCarrierInput = Partial<Omit<ShippingCarrier, 'shippingCarrierId' | 'code' | 'createdAt' | 'updatedAt'>>;

const TABLE = Table.ShippingCarrier;

/**
 * Find a shipping carrier by ID
 */
export async function findById(id: string): Promise<ShippingCarrier | null> {
  return queryOne<ShippingCarrier>(`SELECT * FROM "${TABLE}" WHERE "shippingCarrierId" = $1`, [id]);
}

/**
 * Find a shipping carrier by code
 */
export async function findByCode(code: string): Promise<ShippingCarrier | null> {
  return queryOne<ShippingCarrier>(`SELECT * FROM "${TABLE}" WHERE "code" = $1`, [code]);
}

/**
 * Find all shipping carriers
 */
export async function findAll(activeOnly = false): Promise<ShippingCarrier[]> {
  let sql = `SELECT * FROM "${TABLE}"`;
  if (activeOnly) sql += ` WHERE "isActive" = true`;
  sql += ` ORDER BY "name" ASC`;
  return (await query<ShippingCarrier[]>(sql)) || [];
}

/**
 * Find carriers with API integration
 */
export async function findWithApiIntegration(): Promise<ShippingCarrier[]> {
  return (
    (await query<ShippingCarrier[]>(
      `SELECT * FROM "${TABLE}" WHERE "hasApiIntegration" = true AND "isActive" = true ORDER BY "name" ASC`,
    )) || []
  );
}

/**
 * Find carriers by region
 */
export async function findByRegion(region: string): Promise<ShippingCarrier[]> {
  return (
    (await query<ShippingCarrier[]>(
      `SELECT * FROM "${TABLE}" WHERE "supportedRegions" @> $1::jsonb AND "isActive" = true ORDER BY "name" ASC`,
      [JSON.stringify([region])],
    )) || []
  );
}

/**
 * Search carriers by name or code
 */
export async function search(searchTerm: string): Promise<ShippingCarrier[]> {
  return (
    (await query<ShippingCarrier[]>(
      `SELECT * FROM "${TABLE}" WHERE ("name" ILIKE $1 OR "code" ILIKE $1) AND "isActive" = true ORDER BY "name" ASC`,
      [`%${searchTerm}%`],
    )) || []
  );
}

/**
 * Create a new shipping carrier
 */
export async function create(input: CreateShippingCarrierInput): Promise<ShippingCarrier> {
  const existing = await findByCode(input.code);
  if (existing) {
    throw new Error(`Carrier with code '${input.code}' already exists`);
  }

  const result = await queryOne<ShippingCarrier>(
    `INSERT INTO "${TABLE}" (
      "name", "code", "description", "websiteUrl", "trackingUrl", "isActive", "accountNumber",
      "apiCredentials", "supportedRegions", "supportedServices", "requiresContract", "hasApiIntegration",
      "customFields", "createdBy"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
    [
      input.name,
      input.code,
      input.description || null,
      input.websiteUrl || null,
      input.trackingUrl || null,
      input.isActive ?? true,
      input.accountNumber || null,
      input.apiCredentials ? JSON.stringify(input.apiCredentials) : null,
      input.supportedRegions ? JSON.stringify(input.supportedRegions) : null,
      input.supportedServices ? JSON.stringify(input.supportedServices) : null,
      input.requiresContract ?? false,
      input.hasApiIntegration ?? false,
      input.customFields ? JSON.stringify(input.customFields) : null,
      input.createdBy || null,
    ],
  );

  if (!result) throw new Error('Failed to create shipping carrier');
  return result;
}

/**
 * Update a shipping carrier
 */
export async function update(id: string, input: UpdateShippingCarrierInput): Promise<ShippingCarrier | null> {
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const jsonFields = ['apiCredentials', 'supportedRegions', 'supportedServices', 'customFields'];

  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      updateFields.push(`"${key}" = $${paramIndex++}`);
      values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
    }
  });

  if (updateFields.length === 0) return findById(id);

  updateFields.push(`"updatedAt" = NOW()`);
  values.push(id);

  return queryOne<ShippingCarrier>(
    `UPDATE "${TABLE}" SET ${updateFields.join(', ')} WHERE "shippingCarrierId" = $${paramIndex} RETURNING *`,
    values,
  );
}

/**
 * Activate a shipping carrier
 */
export async function activate(id: string): Promise<ShippingCarrier | null> {
  return update(id, { isActive: true });
}

/**
 * Deactivate a shipping carrier
 */
export async function deactivate(id: string): Promise<ShippingCarrier | null> {
  return update(id, { isActive: false });
}

/**
 * Delete a shipping carrier
 */
export async function deleteCarrier(id: string): Promise<boolean> {
  const result = await queryOne<{ shippingCarrierId: string }>(
    `DELETE FROM "${TABLE}" WHERE "shippingCarrierId" = $1 RETURNING "shippingCarrierId"`,
    [id],
  );
  return !!result;
}

/**
 * Count shipping carriers
 */
export async function count(activeOnly = false): Promise<number> {
  let sql = `SELECT COUNT(*) as count FROM "${TABLE}"`;
  if (activeOnly) sql += ` WHERE "isActive" = true`;
  const result = await queryOne<{ count: string }>(sql);
  return result ? parseInt(result.count, 10) : 0;
}

/**
 * Get carrier statistics
 */
export async function getStatistics(): Promise<{
  total: number;
  active: number;
  withApi: number;
  withContract: number;
}> {
  const [total, active, apiResult, contractResult] = await Promise.all([
    count(),
    count(true),
    queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "${TABLE}" WHERE "hasApiIntegration" = true`),
    queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "${TABLE}" WHERE "requiresContract" = true`),
  ]);

  return {
    total,
    active,
    withApi: apiResult ? parseInt(apiResult.count, 10) : 0,
    withContract: contractResult ? parseInt(contractResult.count, 10) : 0,
  };
}

export default {
  findById,
  findByCode,
  findAll,
  findWithApiIntegration,
  findByRegion,
  search,
  create,
  update,
  activate,
  deactivate,
  delete: deleteCarrier,
  count,
  getStatistics,
};
