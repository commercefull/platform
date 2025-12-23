/**
 * Fulfillment Location Repository
 *
 * Manages unified fulfillment locations (warehouses, stores, dropship vendors, 3PLs).
 */

import { query, queryOne } from '../../../libs/db';
import { FulfillmentLocation } from '../../../libs/db/dataModelTypes';

function generateId(): string {
  return `loc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface CreateFulfillmentLocationParams {
  organizationId: string;
  type: 'warehouse' | 'store' | 'dropship_vendor' | '3pl' | 'dark_store';
  name: string;
  code?: string;
  addressId?: string;
  timezone?: string;
  sellerId?: string;
  capabilities?: {
    canShip?: boolean;
    canPickup?: boolean;
    canLocalDeliver?: boolean;
  };
  operatingHours?: Record<string, { open: string; close: string }>;
  latitude?: number;
  longitude?: number;
}

export interface UpdateFulfillmentLocationParams {
  name?: string;
  code?: string;
  addressId?: string;
  timezone?: string;
  isActive?: boolean;
  capabilities?: Record<string, boolean>;
  operatingHours?: Record<string, { open: string; close: string }>;
  latitude?: number;
  longitude?: number;
}

export async function create(params: CreateFulfillmentLocationParams): Promise<FulfillmentLocation> {
  const locationId = generateId();
  const now = new Date();

  const sql = `
    INSERT INTO "fulfillmentLocation" (
      "locationId", "organizationId", "type", "name", "code", "addressId",
      "timezone", "sellerId", "isActive", "capabilities", "operatingHours",
      "latitude", "longitude", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `;

  const result = await query<{ rows: FulfillmentLocation[] }>(sql, [
    locationId,
    params.organizationId,
    params.type,
    params.name,
    params.code || null,
    params.addressId || null,
    params.timezone || 'UTC',
    params.sellerId || null,
    true,
    JSON.stringify(params.capabilities || {}),
    JSON.stringify(params.operatingHours || {}),
    params.latitude || null,
    params.longitude || null,
    now,
    now,
  ]);

  return result!.rows[0];
}

export async function findById(locationId: string): Promise<FulfillmentLocation | null> {
  return queryOne<FulfillmentLocation>('SELECT * FROM "fulfillmentLocation" WHERE "locationId" = $1', [locationId]);
}

export async function findByCode(code: string): Promise<FulfillmentLocation | null> {
  return queryOne<FulfillmentLocation>('SELECT * FROM "fulfillmentLocation" WHERE "code" = $1', [code]);
}

export async function findByOrganization(
  organizationId: string,
  options?: { type?: string; isActive?: boolean },
): Promise<FulfillmentLocation[]> {
  let sql = 'SELECT * FROM "fulfillmentLocation" WHERE "organizationId" = $1';
  const params: unknown[] = [organizationId];
  let paramIndex = 2;

  if (options?.type) {
    sql += ` AND "type" = $${paramIndex++}`;
    params.push(options.type);
  }
  if (options?.isActive !== undefined) {
    sql += ` AND "isActive" = $${paramIndex++}`;
    params.push(options.isActive);
  }

  sql += ' ORDER BY "name" ASC';

  const result = await query<{ rows: FulfillmentLocation[] }>(sql, params);
  return result?.rows ?? [];
}

export async function findBySeller(sellerId: string): Promise<FulfillmentLocation[]> {
  const result = await query<{ rows: FulfillmentLocation[] }>(
    'SELECT * FROM "fulfillmentLocation" WHERE "sellerId" = $1 AND "isActive" = true ORDER BY "name" ASC',
    [sellerId],
  );
  return result?.rows ?? [];
}

export async function update(locationId: string, params: UpdateFulfillmentLocationParams): Promise<FulfillmentLocation | null> {
  const updates: string[] = ['"updatedAt" = $1'];
  const values: unknown[] = [new Date()];
  let paramIndex = 2;

  if (params.name !== undefined) {
    updates.push(`"name" = $${paramIndex++}`);
    values.push(params.name);
  }
  if (params.code !== undefined) {
    updates.push(`"code" = $${paramIndex++}`);
    values.push(params.code);
  }
  if (params.isActive !== undefined) {
    updates.push(`"isActive" = $${paramIndex++}`);
    values.push(params.isActive);
  }
  if (params.capabilities !== undefined) {
    updates.push(`"capabilities" = $${paramIndex++}`);
    values.push(JSON.stringify(params.capabilities));
  }

  values.push(locationId);
  const sql = `
    UPDATE "fulfillmentLocation" 
    SET ${updates.join(', ')}
    WHERE "locationId" = $${paramIndex}
    RETURNING *
  `;

  const result = await query<{ rows: FulfillmentLocation[] }>(sql, values);
  return result?.rows?.[0] ?? null;
}

export async function activate(locationId: string): Promise<boolean> {
  const result = await query<{ rowCount: number }>(
    'UPDATE "fulfillmentLocation" SET "isActive" = true, "updatedAt" = $1 WHERE "locationId" = $2',
    [new Date(), locationId],
  );
  return (result?.rowCount ?? 0) > 0;
}

export async function deactivate(locationId: string): Promise<boolean> {
  const result = await query<{ rowCount: number }>(
    'UPDATE "fulfillmentLocation" SET "isActive" = false, "updatedAt" = $1 WHERE "locationId" = $2',
    [new Date(), locationId],
  );
  return (result?.rowCount ?? 0) > 0;
}

export async function findNearestLocations(
  latitude: number,
  longitude: number,
  options?: { limit?: number; type?: string; organizationId?: string },
): Promise<Array<FulfillmentLocation & { distance: number }>> {
  const limit = options?.limit || 10;

  let sql = `
    SELECT *, 
      (6371 * acos(
        cos(radians($1)) * cos(radians("latitude")) * 
        cos(radians("longitude") - radians($2)) + 
        sin(radians($1)) * sin(radians("latitude"))
      )) as distance
    FROM "fulfillmentLocation"
    WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL AND "isActive" = true
  `;

  const params: unknown[] = [latitude, longitude];
  let paramIndex = 3;

  if (options?.type) {
    sql += ` AND "type" = $${paramIndex++}`;
    params.push(options.type);
  }
  if (options?.organizationId) {
    sql += ` AND "organizationId" = $${paramIndex++}`;
    params.push(options.organizationId);
  }

  sql += ` ORDER BY distance ASC LIMIT $${paramIndex}`;
  params.push(limit);

  const result = await query<{ rows: Array<FulfillmentLocation & { distance: number }> }>(sql, params);
  return result?.rows ?? [];
}

export default {
  create,
  findById,
  findByCode,
  findByOrganization,
  findBySeller,
  update,
  activate,
  deactivate,
  findNearestLocations,
};
