/**
 * Distribution Pickup Repository
 * Handles CRUD operations for store locations and pickup orders (Click & Collect)
 */

import { query, queryOne } from '../../../libs/db';

// Table names
const PICKUP_ORDER_TABLE = 'distributionPickupOrder';

// ============================================================================
// Types
// ============================================================================

export type LocationType = 'store' | 'warehouse' | 'pickup_point' | 'locker';
export type PickupStatus = 'pending' | 'ready' | 'notified' | 'picked_up' | 'expired' | 'cancelled';

export interface StoreLocation {
  storeLocationId: string;
  code: string;
  name: string;
  type: LocationType;
  description?: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  operatingHours?: Record<string, { open: string; close: string }>;
  holidayHours?: Record<string, any>;
  specialHours?: Record<string, any>;
  timezone: string;
  isActive: boolean;
  acceptsPickup: boolean;
  acceptsReturns: boolean;
  hasLocker: boolean;
  lockerCount?: number;
  pickupCapacityPerHour?: number;
  pickupLeadTimeMinutes: number;
  maxPickupDays: number;
  pickupInstructions?: string;
  imageUrl?: string;
  amenities?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PickupOrder {
  distributionPickupOrderId: string;
  orderId: string;
  storeLocationId: string;
  customerId: string;
  pickupNumber?: string;
  status: PickupStatus;
  scheduledPickupAt?: Date;
  pickupWindowStart?: Date;
  pickupWindowEnd?: Date;
  readyAt?: Date;
  notifiedAt?: Date;
  pickedUpAt?: Date;
  expiresAt?: Date;
  pickedUpBy?: string;
  pickupCode?: string;
  lockerNumber?: string;
  lockerCode?: string;
  alternatePickupName?: string;
  alternatePickupPhone?: string;
  alternatePickupEmail?: string;
  customerNotes?: string;
  storeNotes?: string;
  remindersSent: number;
  lastReminderAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Store Locations
// ============================================================================

export async function getLocation(storeLocationId: string): Promise<StoreLocation | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "storeLocation" WHERE "storeLocationId" = $1',
    [storeLocationId]
  );
  return row ? mapToLocation(row) : null;
}

export async function getLocationByCode(code: string): Promise<StoreLocation | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "storeLocation" WHERE "code" = $1',
    [code]
  );
  return row ? mapToLocation(row) : null;
}

export async function getLocations(
  filters?: { type?: LocationType; isActive?: boolean; acceptsPickup?: boolean },
  pagination?: { limit?: number; offset?: number }
): Promise<{ data: StoreLocation[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.type) {
    whereClause += ` AND "type" = $${paramIndex++}`;
    params.push(filters.type);
  }
  if (filters?.isActive !== undefined) {
    whereClause += ` AND "isActive" = $${paramIndex++}`;
    params.push(filters.isActive);
  }
  if (filters?.acceptsPickup !== undefined) {
    whereClause += ` AND "acceptsPickup" = $${paramIndex++}`;
    params.push(filters.acceptsPickup);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "storeLocation" WHERE ${whereClause}`,
    params
  );

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "storeLocation" WHERE ${whereClause} 
     ORDER BY "name" ASC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    data: (rows || []).map(mapToLocation),
    total: parseInt(countResult?.count || '0')
  };
}

export async function getNearbyLocations(
  latitude: number,
  longitude: number,
  radiusKm: number = 50,
  filters?: { acceptsPickup?: boolean }
): Promise<StoreLocation[]> {
  // Haversine formula for distance calculation
  let whereClause = `"isActive" = true AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL`;
  const params: any[] = [latitude, longitude, radiusKm];
  let paramIndex = 4;

  if (filters?.acceptsPickup !== undefined) {
    whereClause += ` AND "acceptsPickup" = $${paramIndex++}`;
    params.push(filters.acceptsPickup);
  }

  const rows = await query<Record<string, any>[]>(
    `SELECT *, 
      (6371 * acos(cos(radians($1)) * cos(radians("latitude")) * cos(radians("longitude") - radians($2)) + sin(radians($1)) * sin(radians("latitude")))) AS distance
     FROM "storeLocation" 
     WHERE ${whereClause}
     HAVING (6371 * acos(cos(radians($1)) * cos(radians("latitude")) * cos(radians("longitude") - radians($2)) + sin(radians($1)) * sin(radians("latitude")))) < $3
     ORDER BY distance ASC`,
    params
  );
  return (rows || []).map(mapToLocation);
}

export async function saveLocation(location: Partial<StoreLocation> & {
  code: string;
  name: string;
  address1: string;
  city: string;
  postalCode: string;
  country: string;
}): Promise<StoreLocation> {
  const now = new Date().toISOString();

  if (location.storeLocationId) {
    await query(
      `UPDATE "storeLocation" SET
        "code" = $1, "name" = $2, "type" = $3, "description" = $4,
        "address1" = $5, "address2" = $6, "city" = $7, "state" = $8,
        "postalCode" = $9, "country" = $10, "latitude" = $11, "longitude" = $12,
        "phone" = $13, "email" = $14, "operatingHours" = $15, "holidayHours" = $16,
        "specialHours" = $17, "timezone" = $18, "isActive" = $19, "acceptsPickup" = $20,
        "acceptsReturns" = $21, "hasLocker" = $22, "lockerCount" = $23,
        "pickupCapacityPerHour" = $24, "pickupLeadTimeMinutes" = $25, "maxPickupDays" = $26,
        "pickupInstructions" = $27, "imageUrl" = $28, "amenities" = $29,
        "metadata" = $30, "updatedAt" = $31
      WHERE "storeLocationId" = $32`,
      [
        location.code, location.name, location.type || 'store', location.description,
        location.address1, location.address2, location.city, location.state,
        location.postalCode, location.country, location.latitude, location.longitude,
        location.phone, location.email,
        location.operatingHours ? JSON.stringify(location.operatingHours) : null,
        location.holidayHours ? JSON.stringify(location.holidayHours) : null,
        location.specialHours ? JSON.stringify(location.specialHours) : null,
        location.timezone || 'UTC', location.isActive !== false,
        location.acceptsPickup !== false, location.acceptsReturns !== false,
        location.hasLocker || false, location.lockerCount,
        location.pickupCapacityPerHour, location.pickupLeadTimeMinutes || 60,
        location.maxPickupDays || 7, location.pickupInstructions, location.imageUrl,
        location.amenities ? JSON.stringify(location.amenities) : null,
        location.metadata ? JSON.stringify(location.metadata) : null,
        now, location.storeLocationId
      ]
    );
    return (await getLocation(location.storeLocationId))!;
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "storeLocation" (
        "code", "name", "type", "description", "address1", "address2", "city",
        "state", "postalCode", "country", "latitude", "longitude", "phone", "email",
        "operatingHours", "holidayHours", "specialHours", "timezone", "isActive",
        "acceptsPickup", "acceptsReturns", "hasLocker", "lockerCount",
        "pickupCapacityPerHour", "pickupLeadTimeMinutes", "maxPickupDays",
        "pickupInstructions", "imageUrl", "amenities", "metadata",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
      RETURNING *`,
      [
        location.code, location.name, location.type || 'store', location.description,
        location.address1, location.address2, location.city, location.state,
        location.postalCode, location.country, location.latitude, location.longitude,
        location.phone, location.email,
        location.operatingHours ? JSON.stringify(location.operatingHours) : null,
        location.holidayHours ? JSON.stringify(location.holidayHours) : null,
        location.specialHours ? JSON.stringify(location.specialHours) : null,
        location.timezone || 'UTC', true, true, true, location.hasLocker || false,
        location.lockerCount, location.pickupCapacityPerHour,
        location.pickupLeadTimeMinutes || 60, location.maxPickupDays || 7,
        location.pickupInstructions, location.imageUrl,
        location.amenities ? JSON.stringify(location.amenities) : null,
        location.metadata ? JSON.stringify(location.metadata) : null, now, now
      ]
    );
    return mapToLocation(result!);
  }
}

export async function deleteLocation(storeLocationId: string): Promise<void> {
  await query(
    'UPDATE "storeLocation" SET "isActive" = false, "updatedAt" = $1 WHERE "storeLocationId" = $2',
    [new Date().toISOString(), storeLocationId]
  );
}

// ============================================================================
// Pickup Orders
// ============================================================================

export async function getPickupOrder(pickupOrderId: string): Promise<PickupOrder | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "distributionPickupOrder" WHERE "distributionPickupOrderId" = $1',
    [pickupOrderId]
  );
  return row ? mapToPickupOrder(row) : null;
}

export async function getPickupOrderByOrderId(orderId: string): Promise<PickupOrder | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "distributionPickupOrder" WHERE "orderId" = $1',
    [orderId]
  );
  return row ? mapToPickupOrder(row) : null;
}

export async function getPickupOrders(
  filters?: { storeLocationId?: string; customerId?: string; status?: PickupStatus },
  pagination?: { limit?: number; offset?: number }
): Promise<{ data: PickupOrder[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.storeLocationId) {
    whereClause += ` AND "storeLocationId" = $${paramIndex++}`;
    params.push(filters.storeLocationId);
  }
  if (filters?.customerId) {
    whereClause += ` AND "customerId" = $${paramIndex++}`;
    params.push(filters.customerId);
  }
  if (filters?.status) {
    whereClause += ` AND "status" = $${paramIndex++}`;
    params.push(filters.status);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "distributionPickupOrder" WHERE ${whereClause}`,
    params
  );

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "distributionPickupOrder" WHERE ${whereClause} 
     ORDER BY "scheduledPickupAt" ASC NULLS LAST, "createdAt" DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    data: (rows || []).map(mapToPickupOrder),
    total: parseInt(countResult?.count || '0')
  };
}

export async function createPickupOrder(pickup: {
  orderId: string;
  storeLocationId: string;
  customerId: string;
  scheduledPickupAt?: Date;
  alternatePickupName?: string;
  alternatePickupPhone?: string;
  alternatePickupEmail?: string;
  customerNotes?: string;
}): Promise<PickupOrder> {
  const location = await getLocation(pickup.storeLocationId);
  if (!location) throw new Error('Store location not found');
  if (!location.acceptsPickup) throw new Error('This location does not accept pickups');

  const now = new Date();
  const pickupNumber = await generatePickupNumber();
  const pickupCode = generatePickupCode();
  
  // Calculate pickup window
  const scheduledAt = pickup.scheduledPickupAt || new Date(now.getTime() + location.pickupLeadTimeMinutes * 60 * 1000);
  const windowEnd = new Date(scheduledAt.getTime() + 2 * 60 * 60 * 1000); // 2 hour window
  const expiresAt = new Date(scheduledAt.getTime() + location.maxPickupDays * 24 * 60 * 60 * 1000);

  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "distributionPickupOrder" (
      "orderId", "storeLocationId", "customerId", "pickupNumber", "status",
      "scheduledPickupAt", "pickupWindowStart", "pickupWindowEnd", "expiresAt",
      "pickupCode", "alternatePickupName", "alternatePickupPhone", "alternatePickupEmail",
      "customerNotes", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *`,
    [
      pickup.orderId, pickup.storeLocationId, pickup.customerId, pickupNumber,
      scheduledAt.toISOString(), scheduledAt.toISOString(), windowEnd.toISOString(),
      expiresAt.toISOString(), pickupCode, pickup.alternatePickupName,
      pickup.alternatePickupPhone, pickup.alternatePickupEmail, pickup.customerNotes,
      now.toISOString(), now.toISOString()
    ]
  );

  return mapToPickupOrder(result!);
}

export async function markPickupReady(pickupOrderId: string, lockerNumber?: string, lockerCode?: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "distributionPickupOrder" SET 
      "status" = 'ready', "readyAt" = $1, "lockerNumber" = $2, "lockerCode" = $3, "updatedAt" = $1
     WHERE "distributionPickupOrderId" = $4`,
    [now, lockerNumber, lockerCode, pickupOrderId]
  );
}

export async function notifyPickupReady(pickupOrderId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "distributionPickupOrder" SET "status" = 'notified', "notifiedAt" = $1, "updatedAt" = $1
     WHERE "distributionPickupOrderId" = $2`,
    [now, pickupOrderId]
  );
}

export async function completePickup(pickupOrderId: string, pickedUpBy?: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "distributionPickupOrder" SET 
      "status" = 'picked_up', "pickedUpAt" = $1, "pickedUpBy" = $2, "updatedAt" = $1
     WHERE "distributionPickupOrderId" = $3`,
    [now, pickedUpBy, pickupOrderId]
  );
}

export async function cancelPickup(pickupOrderId: string): Promise<void> {
  await query(
    `UPDATE "distributionPickupOrder" SET "status" = 'cancelled', "updatedAt" = $1
     WHERE "distributionPickupOrderId" = $2`,
    [new Date().toISOString(), pickupOrderId]
  );
}

export async function expirePickups(): Promise<number> {
  const result = await query(
    `UPDATE "distributionPickupOrder" SET "status" = 'expired', "updatedAt" = $1
     WHERE "status" IN ('pending', 'ready', 'notified') AND "expiresAt" < NOW()`,
    [new Date().toISOString()]
  );
  return (result as any)?.rowCount || 0;
}

export async function verifyPickupCode(pickupOrderId: string, code: string): Promise<boolean> {
  const pickup = await getPickupOrder(pickupOrderId);
  if (!pickup) return false;
  return pickup.pickupCode === code || pickup.lockerCode === code;
}

// ============================================================================
// Helpers
// ============================================================================

async function generatePickupNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "distributionPickupOrder" WHERE "pickupNumber" LIKE $1`,
    [`PU${year}%`]
  );
  const count = parseInt(result?.count || '0') + 1;
  return `PU${year}-${count.toString().padStart(6, '0')}`;
}

function generatePickupCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function mapToLocation(row: Record<string, any>): StoreLocation {
  return {
    storeLocationId: row.storeLocationId,
    code: row.code,
    name: row.name,
    type: row.type,
    description: row.description,
    address1: row.address1,
    address2: row.address2,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    country: row.country,
    latitude: row.latitude ? parseFloat(row.latitude) : undefined,
    longitude: row.longitude ? parseFloat(row.longitude) : undefined,
    phone: row.phone,
    email: row.email,
    operatingHours: row.operatingHours,
    holidayHours: row.holidayHours,
    specialHours: row.specialHours,
    timezone: row.timezone || 'UTC',
    isActive: Boolean(row.isActive),
    acceptsPickup: Boolean(row.acceptsPickup),
    acceptsReturns: Boolean(row.acceptsReturns),
    hasLocker: Boolean(row.hasLocker),
    lockerCount: row.lockerCount ? parseInt(row.lockerCount) : undefined,
    pickupCapacityPerHour: row.pickupCapacityPerHour ? parseInt(row.pickupCapacityPerHour) : undefined,
    pickupLeadTimeMinutes: parseInt(row.pickupLeadTimeMinutes) || 60,
    maxPickupDays: parseInt(row.maxPickupDays) || 7,
    pickupInstructions: row.pickupInstructions,
    imageUrl: row.imageUrl,
    amenities: row.amenities,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function mapToPickupOrder(row: Record<string, any>): PickupOrder {
  return {
    distributionPickupOrderId: row.distributionPickupOrderId,
    orderId: row.orderId,
    storeLocationId: row.storeLocationId,
    customerId: row.customerId,
    pickupNumber: row.pickupNumber,
    status: row.status,
    scheduledPickupAt: row.scheduledPickupAt ? new Date(row.scheduledPickupAt) : undefined,
    pickupWindowStart: row.pickupWindowStart ? new Date(row.pickupWindowStart) : undefined,
    pickupWindowEnd: row.pickupWindowEnd ? new Date(row.pickupWindowEnd) : undefined,
    readyAt: row.readyAt ? new Date(row.readyAt) : undefined,
    notifiedAt: row.notifiedAt ? new Date(row.notifiedAt) : undefined,
    pickedUpAt: row.pickedUpAt ? new Date(row.pickedUpAt) : undefined,
    expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
    pickedUpBy: row.pickedUpBy,
    pickupCode: row.pickupCode,
    lockerNumber: row.lockerNumber,
    lockerCode: row.lockerCode,
    alternatePickupName: row.alternatePickupName,
    alternatePickupPhone: row.alternatePickupPhone,
    alternatePickupEmail: row.alternatePickupEmail,
    customerNotes: row.customerNotes,
    storeNotes: row.storeNotes,
    remindersSent: parseInt(row.remindersSent) || 0,
    lastReminderAt: row.lastReminderAt ? new Date(row.lastReminderAt) : undefined,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}
