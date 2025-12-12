/**
 * Distribution Shipping Repository
 * Manages shipping carriers, methods, zones, and rates
 */
import { query, queryOne } from '../../../libs/db';

// =============================================================================
// Types
// =============================================================================

export interface DistributionShippingCarrier {
  distributionShippingCarrierId: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  code: string;
  description: string | null;
  websiteUrl: string | null;
  trackingUrl: string | null;
  isActive: boolean;
  accountNumber: string | null;
  apiCredentials: Record<string, unknown> | null;
  supportedRegions: string[] | null;
  supportedServices: string[] | null;
  requiresContract: boolean;
  hasApiIntegration: boolean;
  customFields: Record<string, unknown> | null;
  createdBy: string | null;
}

export interface DistributionShippingMethod {
  distributionShippingMethodId: string;
  createdAt: Date;
  updatedAt: Date;
  distributionShippingCarrierId: string | null;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  serviceCode: string | null;
  domesticInternational: 'domestic' | 'international' | 'both';
  estimatedDeliveryDays: { min: number; max: number } | null;
  handlingDays: number;
  priority: number;
  displayOnFrontend: boolean;
  allowFreeShipping: boolean;
  minWeight: string | null;
  maxWeight: string | null;
  minOrderValue: string | null;
  maxOrderValue: string | null;
  dimensionRestrictions: Record<string, unknown> | null;
  shippingClass: string | null;
  customFields: Record<string, unknown> | null;
  createdBy: string | null;
}

export interface DistributionShippingZone {
  distributionShippingZoneId: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description: string | null;
  isActive: boolean;
  priority: number;
  locationType: 'country' | 'state' | 'zipcode' | 'region' | 'continent';
  locations: string[];
  excludedLocations: string[] | null;
  createdBy: string | null;
}

export interface DistributionShippingRate {
  distributionShippingRateId: string;
  createdAt: Date;
  updatedAt: Date;
  distributionShippingZoneId: string;
  distributionShippingMethodId: string;
  name: string | null;
  description: string | null;
  isActive: boolean;
  rateType: 'flat' | 'weightBased' | 'priceBased' | 'itemBased' | 'dimensional' | 'calculated' | 'free';
  baseRate: string;
  perItemRate: string;
  freeThreshold: string | null;
  rateMatrix: Record<string, unknown> | null;
  minRate: string | null;
  maxRate: string | null;
  currency: string;
  taxable: boolean;
  priority: number;
  validFrom: Date | null;
  validTo: Date | null;
  conditions: Record<string, unknown> | null;
  createdBy: string | null;
}

// Create/Update param types
export type ShippingCarrierCreateParams = Omit<DistributionShippingCarrier, 'distributionShippingCarrierId' | 'createdAt' | 'updatedAt'>;
export type ShippingCarrierUpdateParams = Partial<ShippingCarrierCreateParams>;

export type ShippingMethodCreateParams = Omit<DistributionShippingMethod, 'distributionShippingMethodId' | 'createdAt' | 'updatedAt'>;
export type ShippingMethodUpdateParams = Partial<ShippingMethodCreateParams>;

export type ShippingZoneCreateParams = Omit<DistributionShippingZone, 'distributionShippingZoneId' | 'createdAt' | 'updatedAt'>;
export type ShippingZoneUpdateParams = Partial<ShippingZoneCreateParams>;

export type ShippingRateCreateParams = Omit<DistributionShippingRate, 'distributionShippingRateId' | 'createdAt' | 'updatedAt'>;
export type ShippingRateUpdateParams = Partial<ShippingRateCreateParams>;

// =============================================================================
// Table Names
// =============================================================================

const CARRIER_TABLE = 'distributionShippingCarrier';
const METHOD_TABLE = 'distributionShippingMethod';
const ZONE_TABLE = 'distributionShippingZone';
const RATE_TABLE = 'distributionShippingRate';

// =============================================================================
// Shipping Carrier Methods
// =============================================================================

async function findAllCarriers(filters: { isActive?: boolean } = {}): Promise<DistributionShippingCarrier[]> {
  let sql = `SELECT * FROM "${CARRIER_TABLE}"`;
  const values: any[] = [];

  if (filters.isActive !== undefined) {
    sql += ` WHERE "isActive" = $1`;
    values.push(filters.isActive);
  }

  sql += ` ORDER BY "name"`;
  const result = await query<DistributionShippingCarrier[]>(sql, values);
  return result || [];
}

async function findCarrierById(id: string): Promise<DistributionShippingCarrier | null> {
  return queryOne<DistributionShippingCarrier>(
    `SELECT * FROM "${CARRIER_TABLE}" WHERE "distributionShippingCarrierId" = $1`,
    [id]
  );
}

async function findCarrierByCode(code: string): Promise<DistributionShippingCarrier | null> {
  return queryOne<DistributionShippingCarrier>(
    `SELECT * FROM "${CARRIER_TABLE}" WHERE "code" = $1`,
    [code]
  );
}

async function createCarrier(data: ShippingCarrierCreateParams): Promise<DistributionShippingCarrier | null> {
  return queryOne<DistributionShippingCarrier>(
    `INSERT INTO "${CARRIER_TABLE}" (
      "name", "code", "description", "websiteUrl", "trackingUrl", "isActive",
      "accountNumber", "apiCredentials", "supportedRegions", "supportedServices",
      "requiresContract", "hasApiIntegration", "customFields", "createdBy"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      data.name,
      data.code,
      data.description || null,
      data.websiteUrl || null,
      data.trackingUrl || null,
      data.isActive ?? true,
      data.accountNumber || null,
      data.apiCredentials ? JSON.stringify(data.apiCredentials) : null,
      data.supportedRegions || null,
      data.supportedServices || null,
      data.requiresContract ?? false,
      data.hasApiIntegration ?? false,
      data.customFields ? JSON.stringify(data.customFields) : null,
      data.createdBy || null
    ]
  );
}

async function updateCarrier(id: string, data: ShippingCarrierUpdateParams): Promise<DistributionShippingCarrier | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fields: (keyof ShippingCarrierUpdateParams)[] = [
    'name', 'code', 'description', 'websiteUrl', 'trackingUrl', 'isActive',
    'accountNumber', 'apiCredentials', 'supportedRegions', 'supportedServices',
    'requiresContract', 'hasApiIntegration', 'customFields'
  ];

  for (const field of fields) {
    if (data[field] !== undefined) {
      updates.push(`"${field}" = $${paramIndex++}`);
      const value = data[field];
      values.push(
        (field === 'apiCredentials' || field === 'customFields') && value
          ? JSON.stringify(value)
          : value
      );
    }
  }

  if (updates.length === 0) return findCarrierById(id);

  updates.push(`"updatedAt" = NOW()`);
  values.push(id);

  return queryOne<DistributionShippingCarrier>(
    `UPDATE "${CARRIER_TABLE}" SET ${updates.join(', ')} WHERE "distributionShippingCarrierId" = $${paramIndex} RETURNING *`,
    values
  );
}

async function deleteCarrier(id: string): Promise<boolean> {
  const result = await queryOne<{ distributionShippingCarrierId: string }>(
    `DELETE FROM "${CARRIER_TABLE}" WHERE "distributionShippingCarrierId" = $1 RETURNING "distributionShippingCarrierId"`,
    [id]
  );
  return !!result;
}

// =============================================================================
// Shipping Method Methods
// =============================================================================

async function findAllMethods(filters: { isActive?: boolean; carrierId?: string } = {}): Promise<DistributionShippingMethod[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (filters.isActive !== undefined) {
    conditions.push(`"isActive" = $${paramIndex++}`);
    values.push(filters.isActive);
  }

  if (filters.carrierId) {
    conditions.push(`"distributionShippingCarrierId" = $${paramIndex++}`);
    values.push(filters.carrierId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query<DistributionShippingMethod[]>(
    `SELECT * FROM "${METHOD_TABLE}" ${whereClause} ORDER BY "priority", "name"`,
    values
  );
  return result || [];
}

async function findMethodById(id: string): Promise<DistributionShippingMethod | null> {
  return queryOne<DistributionShippingMethod>(
    `SELECT * FROM "${METHOD_TABLE}" WHERE "distributionShippingMethodId" = $1`,
    [id]
  );
}

async function findMethodByCode(code: string): Promise<DistributionShippingMethod | null> {
  return queryOne<DistributionShippingMethod>(
    `SELECT * FROM "${METHOD_TABLE}" WHERE "code" = $1`,
    [code]
  );
}

async function findDefaultMethod(): Promise<DistributionShippingMethod | null> {
  return queryOne<DistributionShippingMethod>(
    `SELECT * FROM "${METHOD_TABLE}" WHERE "isDefault" = true AND "isActive" = true LIMIT 1`
  );
}

async function createMethod(data: ShippingMethodCreateParams): Promise<DistributionShippingMethod | null> {
  return queryOne<DistributionShippingMethod>(
    `INSERT INTO "${METHOD_TABLE}" (
      "distributionShippingCarrierId", "name", "code", "description", "isActive", "isDefault",
      "serviceCode", "domesticInternational", "estimatedDeliveryDays", "handlingDays",
      "priority", "displayOnFrontend", "allowFreeShipping", "minWeight", "maxWeight",
      "minOrderValue", "maxOrderValue", "dimensionRestrictions", "shippingClass", "customFields", "createdBy"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    RETURNING *`,
    [
      data.distributionShippingCarrierId || null,
      data.name,
      data.code,
      data.description || null,
      data.isActive ?? true,
      data.isDefault ?? false,
      data.serviceCode || null,
      data.domesticInternational ?? 'both',
      data.estimatedDeliveryDays ? JSON.stringify(data.estimatedDeliveryDays) : null,
      data.handlingDays ?? 1,
      data.priority ?? 0,
      data.displayOnFrontend ?? true,
      data.allowFreeShipping ?? true,
      data.minWeight || null,
      data.maxWeight || null,
      data.minOrderValue || null,
      data.maxOrderValue || null,
      data.dimensionRestrictions ? JSON.stringify(data.dimensionRestrictions) : null,
      data.shippingClass || null,
      data.customFields ? JSON.stringify(data.customFields) : null,
      data.createdBy || null
    ]
  );
}

async function updateMethod(id: string, data: ShippingMethodUpdateParams): Promise<DistributionShippingMethod | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const jsonFields = ['estimatedDeliveryDays', 'dimensionRestrictions', 'customFields'];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`"${key}" = $${paramIndex++}`);
      values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
    }
  }

  if (updates.length === 0) return findMethodById(id);

  updates.push(`"updatedAt" = NOW()`);
  values.push(id);

  return queryOne<DistributionShippingMethod>(
    `UPDATE "${METHOD_TABLE}" SET ${updates.join(', ')} WHERE "distributionShippingMethodId" = $${paramIndex} RETURNING *`,
    values
  );
}

async function deleteMethod(id: string): Promise<boolean> {
  const result = await queryOne<{ distributionShippingMethodId: string }>(
    `DELETE FROM "${METHOD_TABLE}" WHERE "distributionShippingMethodId" = $1 RETURNING "distributionShippingMethodId"`,
    [id]
  );
  return !!result;
}

// =============================================================================
// Shipping Zone Methods
// =============================================================================

async function findAllZones(filters: { isActive?: boolean } = {}): Promise<DistributionShippingZone[]> {
  let sql = `SELECT * FROM "${ZONE_TABLE}"`;
  const values: any[] = [];

  if (filters.isActive !== undefined) {
    sql += ` WHERE "isActive" = $1`;
    values.push(filters.isActive);
  }

  sql += ` ORDER BY "priority", "name"`;
  const result = await query<DistributionShippingZone[]>(sql, values);
  return result || [];
}

async function findZoneById(id: string): Promise<DistributionShippingZone | null> {
  return queryOne<DistributionShippingZone>(
    `SELECT * FROM "${ZONE_TABLE}" WHERE "distributionShippingZoneId" = $1`,
    [id]
  );
}

async function findZoneByName(name: string): Promise<DistributionShippingZone | null> {
  return queryOne<DistributionShippingZone>(
    `SELECT * FROM "${ZONE_TABLE}" WHERE "name" = $1`,
    [name]
  );
}

async function findZoneForLocation(country: string, state?: string, postalCode?: string): Promise<DistributionShippingZone | null> {
  // Find the most specific matching zone by priority
  const result = await queryOne<DistributionShippingZone>(
    `SELECT * FROM "${ZONE_TABLE}" 
     WHERE "isActive" = true 
     AND ("locations" @> $1::jsonb OR "locations" @> '["*"]'::jsonb)
     AND ("excludedLocations" IS NULL OR NOT "excludedLocations" @> $1::jsonb)
     ORDER BY "priority" DESC
     LIMIT 1`,
    [JSON.stringify([country])]
  );
  return result;
}

async function createZone(data: ShippingZoneCreateParams): Promise<DistributionShippingZone | null> {
  return queryOne<DistributionShippingZone>(
    `INSERT INTO "${ZONE_TABLE}" (
      "name", "description", "isActive", "priority", "locationType", "locations", "excludedLocations", "createdBy"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      data.name,
      data.description || null,
      data.isActive ?? true,
      data.priority ?? 0,
      data.locationType ?? 'country',
      JSON.stringify(data.locations),
      data.excludedLocations ? JSON.stringify(data.excludedLocations) : null,
      data.createdBy || null
    ]
  );
}

async function updateZone(id: string, data: ShippingZoneUpdateParams): Promise<DistributionShippingZone | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`"${key}" = $${paramIndex++}`);
      values.push((key === 'locations' || key === 'excludedLocations') ? JSON.stringify(value) : value);
    }
  }

  if (updates.length === 0) return findZoneById(id);

  updates.push(`"updatedAt" = NOW()`);
  values.push(id);

  return queryOne<DistributionShippingZone>(
    `UPDATE "${ZONE_TABLE}" SET ${updates.join(', ')} WHERE "distributionShippingZoneId" = $${paramIndex} RETURNING *`,
    values
  );
}

async function deleteZone(id: string): Promise<boolean> {
  const result = await queryOne<{ distributionShippingZoneId: string }>(
    `DELETE FROM "${ZONE_TABLE}" WHERE "distributionShippingZoneId" = $1 RETURNING "distributionShippingZoneId"`,
    [id]
  );
  return !!result;
}

// =============================================================================
// Shipping Rate Methods
// =============================================================================

async function findAllRates(filters: { zoneId?: string; methodId?: string; isActive?: boolean } = {}): Promise<DistributionShippingRate[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (filters.zoneId) {
    conditions.push(`"distributionShippingZoneId" = $${paramIndex++}`);
    values.push(filters.zoneId);
  }

  if (filters.methodId) {
    conditions.push(`"distributionShippingMethodId" = $${paramIndex++}`);
    values.push(filters.methodId);
  }

  if (filters.isActive !== undefined) {
    conditions.push(`"isActive" = $${paramIndex++}`);
    values.push(filters.isActive);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query<DistributionShippingRate[]>(
    `SELECT * FROM "${RATE_TABLE}" ${whereClause} ORDER BY "priority"`,
    values
  );
  return result || [];
}

async function findRateById(id: string): Promise<DistributionShippingRate | null> {
  return queryOne<DistributionShippingRate>(
    `SELECT * FROM "${RATE_TABLE}" WHERE "distributionShippingRateId" = $1`,
    [id]
  );
}

async function findRateForZoneAndMethod(zoneId: string, methodId: string): Promise<DistributionShippingRate | null> {
  return queryOne<DistributionShippingRate>(
    `SELECT * FROM "${RATE_TABLE}" 
     WHERE "distributionShippingZoneId" = $1 AND "distributionShippingMethodId" = $2 AND "isActive" = true`,
    [zoneId, methodId]
  );
}

async function createRate(data: ShippingRateCreateParams): Promise<DistributionShippingRate | null> {
  return queryOne<DistributionShippingRate>(
    `INSERT INTO "${RATE_TABLE}" (
      "distributionShippingZoneId", "distributionShippingMethodId", "name", "description",
      "isActive", "rateType", "baseRate", "perItemRate", "freeThreshold", "rateMatrix",
      "minRate", "maxRate", "currency", "taxable", "priority", "validFrom", "validTo", "conditions", "createdBy"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    RETURNING *`,
    [
      data.distributionShippingZoneId,
      data.distributionShippingMethodId,
      data.name || null,
      data.description || null,
      data.isActive ?? true,
      data.rateType,
      data.baseRate,
      data.perItemRate ?? '0',
      data.freeThreshold || null,
      data.rateMatrix ? JSON.stringify(data.rateMatrix) : null,
      data.minRate || null,
      data.maxRate || null,
      data.currency ?? 'USD',
      data.taxable ?? true,
      data.priority ?? 0,
      data.validFrom || null,
      data.validTo || null,
      data.conditions ? JSON.stringify(data.conditions) : null,
      data.createdBy || null
    ]
  );
}

async function updateRate(id: string, data: ShippingRateUpdateParams): Promise<DistributionShippingRate | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const jsonFields = ['rateMatrix', 'conditions'];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`"${key}" = $${paramIndex++}`);
      values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
    }
  }

  if (updates.length === 0) return findRateById(id);

  updates.push(`"updatedAt" = NOW()`);
  values.push(id);

  return queryOne<DistributionShippingRate>(
    `UPDATE "${RATE_TABLE}" SET ${updates.join(', ')} WHERE "distributionShippingRateId" = $${paramIndex} RETURNING *`,
    values
  );
}

async function deleteRate(id: string): Promise<boolean> {
  const result = await queryOne<{ distributionShippingRateId: string }>(
    `DELETE FROM "${RATE_TABLE}" WHERE "distributionShippingRateId" = $1 RETURNING "distributionShippingRateId"`,
    [id]
  );
  return !!result;
}

// =============================================================================
// Named Exports (for controller compatibility)
// =============================================================================

// Shipping Carriers
export async function findAllShippingCarriers(pagination?: { limit?: number; offset?: number }): Promise<{ carriers: DistributionShippingCarrier[]; total: number }> {
  const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "${CARRIER_TABLE}"`);
  const total = parseInt(countResult?.count || '0');
  
  let sql = `SELECT * FROM "${CARRIER_TABLE}" ORDER BY "name"`;
  const params: any[] = [];
  let paramIndex = 1;
  
  if (pagination?.limit) {
    sql += ` LIMIT $${paramIndex++}`;
    params.push(pagination.limit);
    if (pagination.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(pagination.offset);
    }
  }
  
  const carriers = await query<DistributionShippingCarrier[]>(sql, params);
  return { carriers: carriers || [], total };
}

export async function findActiveShippingCarriers(): Promise<DistributionShippingCarrier[]> {
  return findAllCarriers({ isActive: true });
}

export const findShippingCarrierById = findCarrierById;
export const findShippingCarrierByCode = findCarrierByCode;
export const createShippingCarrier = createCarrier;
export const updateShippingCarrier = updateCarrier;
export const deleteShippingCarrier = deleteCarrier;

// Shipping Methods
export async function findAllShippingMethods(pagination?: { limit?: number; offset?: number }): Promise<{ methods: DistributionShippingMethod[]; total: number }> {
  const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "${METHOD_TABLE}"`);
  const total = parseInt(countResult?.count || '0');
  
  let sql = `SELECT * FROM "${METHOD_TABLE}" ORDER BY "priority", "name"`;
  const params: any[] = [];
  let paramIndex = 1;
  
  if (pagination?.limit) {
    sql += ` LIMIT $${paramIndex++}`;
    params.push(pagination.limit);
    if (pagination.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(pagination.offset);
    }
  }
  
  const methods = await query<DistributionShippingMethod[]>(sql, params);
  return { methods: methods || [], total };
}

export async function findActiveShippingMethods(): Promise<DistributionShippingMethod[]> {
  return findAllMethods({ isActive: true });
}

export async function findShippingMethodsByCarrier(carrierId: string): Promise<DistributionShippingMethod[]> {
  return findAllMethods({ carrierId });
}

export const findShippingMethodById = findMethodById;
export const findShippingMethodByCode = findMethodByCode;
export const createShippingMethod = createMethod;
export const updateShippingMethod = updateMethod;
export const deleteShippingMethod = deleteMethod;

// Shipping Zones
export async function findAllShippingZones(pagination?: { limit?: number; offset?: number }): Promise<{ zones: DistributionShippingZone[]; total: number }> {
  const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "${ZONE_TABLE}"`);
  const total = parseInt(countResult?.count || '0');
  
  let sql = `SELECT * FROM "${ZONE_TABLE}" ORDER BY "priority", "name"`;
  const params: any[] = [];
  let paramIndex = 1;
  
  if (pagination?.limit) {
    sql += ` LIMIT $${paramIndex++}`;
    params.push(pagination.limit);
    if (pagination.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(pagination.offset);
    }
  }
  
  const zones = await query<DistributionShippingZone[]>(sql, params);
  return { zones: zones || [], total };
}

export async function findActiveShippingZones(): Promise<DistributionShippingZone[]> {
  return findAllZones({ isActive: true });
}

export const findShippingZoneById = findZoneById;
export const findShippingZoneByName = findZoneByName;
export const createShippingZone = createZone;
export const updateShippingZone = updateZone;
export const deleteShippingZone = deleteZone;

// Shipping Rates
export async function findAllShippingRates(pagination?: { limit?: number; offset?: number }): Promise<{ rates: DistributionShippingRate[]; total: number }> {
  const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "${RATE_TABLE}"`);
  const total = parseInt(countResult?.count || '0');
  
  let sql = `SELECT * FROM "${RATE_TABLE}" ORDER BY "priority"`;
  const params: any[] = [];
  let paramIndex = 1;
  
  if (pagination?.limit) {
    sql += ` LIMIT $${paramIndex++}`;
    params.push(pagination.limit);
    if (pagination.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(pagination.offset);
    }
  }
  
  const rates = await query<DistributionShippingRate[]>(sql, params);
  return { rates: rates || [], total };
}

export async function findShippingRatesByZone(zoneId: string): Promise<DistributionShippingRate[]> {
  return findAllRates({ zoneId });
}

export async function findShippingRatesByMethod(methodId: string): Promise<DistributionShippingRate[]> {
  return findAllRates({ methodId });
}

export async function findShippingRatesByZoneAndMethod(zoneId: string, methodId: string): Promise<DistributionShippingRate[]> {
  return findAllRates({ zoneId, methodId });
}

export const findShippingRateById = findRateById;
export const createShippingRate = createRate;
export const updateShippingRate = updateRate;
export const deleteShippingRate = deleteRate;

// =============================================================================
// Default Export (for backward compatibility)
// =============================================================================

export default {
  // Carriers
  findAllCarriers,
  findCarrierById,
  findCarrierByCode,
  createCarrier,
  updateCarrier,
  deleteCarrier,
  findAllShippingCarriers,
  findActiveShippingCarriers,
  findShippingCarrierById,
  findShippingCarrierByCode,
  createShippingCarrier,
  updateShippingCarrier,
  deleteShippingCarrier,

  // Methods
  findAllMethods,
  findMethodById,
  findMethodByCode,
  findDefaultMethod,
  createMethod,
  updateMethod,
  deleteMethod,
  findAllShippingMethods,
  findActiveShippingMethods,
  findShippingMethodsByCarrier,
  findShippingMethodById,
  findShippingMethodByCode,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,

  // Zones
  findAllZones,
  findZoneById,
  findZoneByName,
  findZoneForLocation,
  createZone,
  updateZone,
  deleteZone,
  findAllShippingZones,
  findActiveShippingZones,
  findShippingZoneById,
  findShippingZoneByName,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,

  // Rates
  findAllRates,
  findRateById,
  findRateForZoneAndMethod,
  createRate,
  updateRate,
  deleteRate,
  findAllShippingRates,
  findShippingRatesByZone,
  findShippingRatesByMethod,
  findShippingRateById,
  createShippingRate,
  updateShippingRate,
  deleteShippingRate
};
