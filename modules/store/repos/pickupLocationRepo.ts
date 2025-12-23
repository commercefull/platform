/**
 * Pickup Location Repository
 *
 * Manages store pickup locations for BOPIS (Buy Online, Pick Up In Store).
 * Migrated from distribution module.
 */

import { query, queryOne } from '../../../libs/db';

export interface PickupLocation {
  pickupLocationId: string;
  storeId: string;
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  latitude?: number;
  longitude?: number;
  operatingHours?: Record<string, { open: string; close: string }>;
  isActive: boolean;
  contactPhone?: string;
  contactEmail?: string;
  instructions?: string;
  maxOrdersPerSlot?: number;
  prepareTimeMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePickupLocationParams {
  storeId: string;
  name: string;
  address: PickupLocation['address'];
  latitude?: number;
  longitude?: number;
  operatingHours?: Record<string, { open: string; close: string }>;
  contactPhone?: string;
  contactEmail?: string;
  instructions?: string;
  maxOrdersPerSlot?: number;
  prepareTimeMinutes?: number;
}

export interface UpdatePickupLocationParams {
  name?: string;
  address?: Partial<PickupLocation['address']>;
  latitude?: number;
  longitude?: number;
  operatingHours?: Record<string, { open: string; close: string }>;
  isActive?: boolean;
  contactPhone?: string;
  contactEmail?: string;
  instructions?: string;
  maxOrdersPerSlot?: number;
  prepareTimeMinutes?: number;
}

/**
 * Save (create) a new pickup location
 */
export async function saveLocation(params: CreatePickupLocationParams): Promise<PickupLocation> {
  const pickupLocationId = `ploc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date();

  const sql = `
    INSERT INTO "pickupLocation" (
      "pickupLocationId", "storeId", "name", "addressLine1", "addressLine2",
      "city", "state", "postalCode", "country", "latitude", "longitude",
      "operatingHours", "contactPhone", "contactEmail", "instructions",
      "maxOrdersPerSlot", "prepareTimeMinutes", "isActive", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    RETURNING *
  `;

  const result = await query<{ rows: any[] }>(sql, [
    pickupLocationId,
    params.storeId,
    params.name,
    params.address.line1,
    params.address.line2 || null,
    params.address.city,
    params.address.state || null,
    params.address.postalCode,
    params.address.country,
    params.latitude || null,
    params.longitude || null,
    JSON.stringify(params.operatingHours || {}),
    params.contactPhone || null,
    params.contactEmail || null,
    params.instructions || null,
    params.maxOrdersPerSlot || 10,
    params.prepareTimeMinutes || 60,
    true,
    now,
    now,
  ]);

  return mapToPickupLocation(result!.rows[0]);
}

/**
 * Get a pickup location by ID
 */
export async function getLocation(pickupLocationId: string): Promise<PickupLocation | null> {
  const result = await queryOne('SELECT * FROM "pickupLocation" WHERE "pickupLocationId" = $1', [pickupLocationId]);

  return result ? mapToPickupLocation(result) : null;
}

/**
 * Get all pickup locations, optionally filtered by store
 */
export async function getLocations(storeId?: string): Promise<PickupLocation[]> {
  let sql = 'SELECT * FROM "pickupLocation"';
  const params: unknown[] = [];

  if (storeId) {
    sql += ' WHERE "storeId" = $1';
    params.push(storeId);
  }
  sql += ' ORDER BY "name" ASC';

  const result = await query<{ rows: any[] }>(sql, params);
  return (result?.rows ?? []).map(mapToPickupLocation);
}

/**
 * Update a pickup location
 */
export async function updateLocation(pickupLocationId: string, params: UpdatePickupLocationParams): Promise<PickupLocation | null> {
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (params.name !== undefined) updates.name = params.name;
  if (params.address?.line1 !== undefined) updates.addressLine1 = params.address.line1;
  if (params.address?.line2 !== undefined) updates.addressLine2 = params.address.line2;
  if (params.address?.city !== undefined) updates.city = params.address.city;
  if (params.address?.state !== undefined) updates.state = params.address.state;
  if (params.address?.postalCode !== undefined) updates.postalCode = params.address.postalCode;
  if (params.address?.country !== undefined) updates.country = params.address.country;
  if (params.latitude !== undefined) updates.latitude = params.latitude;
  if (params.longitude !== undefined) updates.longitude = params.longitude;
  if (params.operatingHours !== undefined) updates.operatingHours = JSON.stringify(params.operatingHours);
  if (params.isActive !== undefined) updates.isActive = params.isActive;
  if (params.contactPhone !== undefined) updates.contactPhone = params.contactPhone;
  if (params.contactEmail !== undefined) updates.contactEmail = params.contactEmail;
  if (params.instructions !== undefined) updates.instructions = params.instructions;
  if (params.maxOrdersPerSlot !== undefined) updates.maxOrdersPerSlot = params.maxOrdersPerSlot;
  if (params.prepareTimeMinutes !== undefined) updates.prepareTimeMinutes = params.prepareTimeMinutes;

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  Object.entries(updates).forEach(([key, value]) => {
    setClauses.push(`"${key}" = $${paramIndex++}`);
    values.push(value);
  });

  values.push(pickupLocationId);
  const sql = `
    UPDATE "pickupLocation" 
    SET ${setClauses.join(', ')}
    WHERE "pickupLocationId" = $${paramIndex}
    RETURNING *
  `;

  const result = await query<{ rows: any[] }>(sql, values);
  return (result?.rows?.length ?? 0) > 0 ? mapToPickupLocation(result!.rows[0]) : null;
}

/**
 * Delete a pickup location
 */
export async function deleteLocation(pickupLocationId: string): Promise<boolean> {
  const result = await query<{ rowCount: number }>('DELETE FROM "pickupLocation" WHERE "pickupLocationId" = $1', [pickupLocationId]);

  return (result?.rowCount ?? 0) > 0;
}

/**
 * Get active pickup locations for a store
 */
export async function getActiveLocations(storeId: string): Promise<PickupLocation[]> {
  const result = await query<{ rows: any[] }>(
    'SELECT * FROM "pickupLocation" WHERE "storeId" = $1 AND "isActive" = true ORDER BY "name" ASC',
    [storeId],
  );

  return (result?.rows ?? []).map(mapToPickupLocation);
}

/**
 * Find nearest pickup locations to a coordinate
 */
export async function findNearestLocations(
  latitude: number,
  longitude: number,
  radiusKm: number = 50,
  limit: number = 10,
): Promise<Array<PickupLocation & { distance: number }>> {
  // Using Haversine formula approximation in SQL
  const sql = `
    SELECT * FROM "pickupLocation"
    WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL AND "isActive" = true
    ORDER BY (
      6371 * acos(
        cos(radians($1)) * cos(radians("latitude")) * 
        cos(radians("longitude") - radians($2)) + 
        sin(radians($1)) * sin(radians("latitude"))
      )
    )
    LIMIT $3
  `;
  const results = await query<{ rows: any[] }>(sql, [latitude, longitude, limit]);

  return (results?.rows ?? [])
    .map((row: any) => {
      const location = mapToPickupLocation(row);
      const distance = calculateDistance(latitude, longitude, row.latitude, row.longitude);
      return { ...location, distance };
    })
    .filter((loc: any) => loc.distance <= radiusKm);
}

// Helper to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Map database row to PickupLocation interface
function mapToPickupLocation(row: any): PickupLocation {
  return {
    pickupLocationId: row.pickupLocationId,
    storeId: row.storeId,
    name: row.name,
    address: {
      line1: row.addressLine1,
      line2: row.addressLine2,
      city: row.city,
      state: row.state,
      postalCode: row.postalCode,
      country: row.country,
    },
    latitude: row.latitude ? parseFloat(row.latitude) : undefined,
    longitude: row.longitude ? parseFloat(row.longitude) : undefined,
    operatingHours: typeof row.operatingHours === 'string' ? JSON.parse(row.operatingHours) : row.operatingHours,
    isActive: row.isActive,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    instructions: row.instructions,
    maxOrdersPerSlot: row.maxOrdersPerSlot,
    prepareTimeMinutes: row.prepareTimeMinutes,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

export default {
  saveLocation,
  getLocation,
  getLocations,
  updateLocation,
  deleteLocation,
  getActiveLocations,
  findNearestLocations,
};
