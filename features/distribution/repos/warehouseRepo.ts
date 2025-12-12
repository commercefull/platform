/**
 * Distribution Warehouse Repository
 * Manages warehouses, zones, and bins for inventory storage
 */
import { query, queryOne } from '../../../libs/db';

// =============================================================================
// Types
// =============================================================================

export interface DistributionWarehouse {
  distributionWarehouseId: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  isFulfillmentCenter: boolean;
  isReturnCenter: boolean;
  isVirtual: boolean;
  merchantId: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: string | null;
  longitude: string | null;
  email: string | null;
  phone: string | null;
  contactName: string | null;
  timezone: string;
  cutoffTime: string;
  processingTime: number;
  operatingHours: Record<string, unknown> | null;
  capabilities: string[] | null;
  shippingMethods: string[] | null;
  createdBy: string | null;
}

export interface DistributionWarehouseZone {
  distributionWarehouseZoneId: string;
  createdAt: Date;
  updatedAt: Date;
  distributionWarehouseId: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  zoneType: 'storage' | 'picking' | 'packing' | 'shipping' | 'receiving' | 'returns' | 'quarantine' | 'special';
  capabilities: string[] | null;
  priority: number;
  capacity: string | null;
  capacityUnit: string | null;
  temperature: string | null;
  humidity: string | null;
}

export interface DistributionWarehouseBin {
  distributionWarehouseBinId: string;
  createdAt: Date;
  updatedAt: Date;
  distributionWarehouseId: string;
  distributionWarehouseZoneId: string | null;
  locationCode: string;
  isActive: boolean;
  binType: 'storage' | 'picking' | 'receiving' | 'packing' | 'shipping' | 'returns' | 'damaged' | 'inspection';
  height: string | null;
  width: string | null;
  depth: string | null;
  maxVolume: string | null;
  maxWeight: string | null;
  isPickable: boolean;
  isReceivable: boolean;
  isMixed: boolean;
  priority: number;
}

// Create/Update param types
export type WarehouseCreateParams = Omit<DistributionWarehouse, 'distributionWarehouseId' | 'createdAt' | 'updatedAt'>;
export type WarehouseUpdateParams = Partial<WarehouseCreateParams>;

export type WarehouseZoneCreateParams = Omit<DistributionWarehouseZone, 'distributionWarehouseZoneId' | 'createdAt' | 'updatedAt'>;
export type WarehouseZoneUpdateParams = Partial<Omit<WarehouseZoneCreateParams, 'distributionWarehouseId'>>;

export type WarehouseBinCreateParams = Omit<DistributionWarehouseBin, 'distributionWarehouseBinId' | 'createdAt' | 'updatedAt'>;
export type WarehouseBinUpdateParams = Partial<Omit<WarehouseBinCreateParams, 'distributionWarehouseId'>>;

// =============================================================================
// Table Names
// =============================================================================

const WAREHOUSE_TABLE = 'distributionWarehouse';
const ZONE_TABLE = 'distributionWarehouseZone';
const BIN_TABLE = 'distributionWarehouseBin';

// =============================================================================
// Warehouse Methods
// =============================================================================

async function findAll(filters: { isActive?: boolean; merchantId?: string } = {}): Promise<DistributionWarehouse[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (filters.isActive !== undefined) {
    conditions.push(`"isActive" = $${paramIndex++}`);
    values.push(filters.isActive);
  }

  if (filters.merchantId) {
    conditions.push(`"merchantId" = $${paramIndex++}`);
    values.push(filters.merchantId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query<DistributionWarehouse[]>(
    `SELECT * FROM "${WAREHOUSE_TABLE}" ${whereClause} ORDER BY "name"`,
    values
  );
  return result || [];
}

async function findById(id: string): Promise<DistributionWarehouse | null> {
  return queryOne<DistributionWarehouse>(
    `SELECT * FROM "${WAREHOUSE_TABLE}" WHERE "distributionWarehouseId" = $1`,
    [id]
  );
}

async function findByCode(code: string): Promise<DistributionWarehouse | null> {
  return queryOne<DistributionWarehouse>(
    `SELECT * FROM "${WAREHOUSE_TABLE}" WHERE "code" = $1`,
    [code]
  );
}

async function findDefault(): Promise<DistributionWarehouse | null> {
  return queryOne<DistributionWarehouse>(
    `SELECT * FROM "${WAREHOUSE_TABLE}" WHERE "isDefault" = true AND "isActive" = true LIMIT 1`
  );
}

async function findFulfillmentCenters(): Promise<DistributionWarehouse[]> {
  const result = await query<DistributionWarehouse[]>(
    `SELECT * FROM "${WAREHOUSE_TABLE}" WHERE "isFulfillmentCenter" = true AND "isActive" = true ORDER BY "name"`
  );
  return result || [];
}

async function findReturnCenters(): Promise<DistributionWarehouse[]> {
  const result = await query<DistributionWarehouse[]>(
    `SELECT * FROM "${WAREHOUSE_TABLE}" WHERE "isReturnCenter" = true AND "isActive" = true ORDER BY "name"`
  );
  return result || [];
}

async function findNearestWarehouse(latitude: number, longitude: number): Promise<DistributionWarehouse | null> {
  // Use Haversine formula to find nearest warehouse
  return queryOne<DistributionWarehouse>(
    `SELECT *, 
      (6371 * acos(cos(radians($1)) * cos(radians("latitude"::numeric)) * 
       cos(radians("longitude"::numeric) - radians($2)) + 
       sin(radians($1)) * sin(radians("latitude"::numeric)))) AS distance
     FROM "${WAREHOUSE_TABLE}"
     WHERE "isActive" = true AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL
     ORDER BY distance
     LIMIT 1`,
    [latitude, longitude]
  );
}

async function create(data: WarehouseCreateParams): Promise<DistributionWarehouse | null> {
  return queryOne<DistributionWarehouse>(
    `INSERT INTO "${WAREHOUSE_TABLE}" (
      "name", "code", "description", "isActive", "isDefault", "isFulfillmentCenter",
      "isReturnCenter", "isVirtual", "merchantId", "addressLine1", "addressLine2",
      "city", "state", "postalCode", "country", "latitude", "longitude",
      "email", "phone", "contactName", "timezone", "cutoffTime", "processingTime",
      "operatingHours", "capabilities", "shippingMethods", "createdBy"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
    RETURNING *`,
    [
      data.name,
      data.code,
      data.description || null,
      data.isActive ?? true,
      data.isDefault ?? false,
      data.isFulfillmentCenter ?? true,
      data.isReturnCenter ?? true,
      data.isVirtual ?? false,
      data.merchantId || null,
      data.addressLine1,
      data.addressLine2 || null,
      data.city,
      data.state,
      data.postalCode,
      data.country,
      data.latitude || null,
      data.longitude || null,
      data.email || null,
      data.phone || null,
      data.contactName || null,
      data.timezone ?? 'UTC',
      data.cutoffTime ?? '14:00:00',
      data.processingTime ?? 1,
      data.operatingHours ? JSON.stringify(data.operatingHours) : null,
      data.capabilities || null,
      data.shippingMethods || null,
      data.createdBy || null
    ]
  );
}

async function update(id: string, data: WarehouseUpdateParams): Promise<DistributionWarehouse | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const jsonFields = ['operatingHours'];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`"${key}" = $${paramIndex++}`);
      values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
    }
  }

  if (updates.length === 0) return findById(id);

  updates.push(`"updatedAt" = NOW()`);
  values.push(id);

  return queryOne<DistributionWarehouse>(
    `UPDATE "${WAREHOUSE_TABLE}" SET ${updates.join(', ')} WHERE "distributionWarehouseId" = $${paramIndex} RETURNING *`,
    values
  );
}

async function deleteWarehouse(id: string): Promise<boolean> {
  const result = await queryOne<{ distributionWarehouseId: string }>(
    `DELETE FROM "${WAREHOUSE_TABLE}" WHERE "distributionWarehouseId" = $1 RETURNING "distributionWarehouseId"`,
    [id]
  );
  return !!result;
}

// =============================================================================
// Warehouse Zone Methods
// =============================================================================

async function findAllZones(warehouseId: string, filters: { isActive?: boolean; zoneType?: string } = {}): Promise<DistributionWarehouseZone[]> {
  const conditions: string[] = [`"distributionWarehouseId" = $1`];
  const values: any[] = [warehouseId];
  let paramIndex = 2;

  if (filters.isActive !== undefined) {
    conditions.push(`"isActive" = $${paramIndex++}`);
    values.push(filters.isActive);
  }

  if (filters.zoneType) {
    conditions.push(`"zoneType" = $${paramIndex++}`);
    values.push(filters.zoneType);
  }

  const result = await query<DistributionWarehouseZone[]>(
    `SELECT * FROM "${ZONE_TABLE}" WHERE ${conditions.join(' AND ')} ORDER BY "priority", "name"`,
    values
  );
  return result || [];
}

async function findZoneById(id: string): Promise<DistributionWarehouseZone | null> {
  return queryOne<DistributionWarehouseZone>(
    `SELECT * FROM "${ZONE_TABLE}" WHERE "distributionWarehouseZoneId" = $1`,
    [id]
  );
}

async function findZoneByCode(warehouseId: string, code: string): Promise<DistributionWarehouseZone | null> {
  return queryOne<DistributionWarehouseZone>(
    `SELECT * FROM "${ZONE_TABLE}" WHERE "distributionWarehouseId" = $1 AND "code" = $2`,
    [warehouseId, code]
  );
}

async function createZone(data: WarehouseZoneCreateParams): Promise<DistributionWarehouseZone | null> {
  return queryOne<DistributionWarehouseZone>(
    `INSERT INTO "${ZONE_TABLE}" (
      "distributionWarehouseId", "name", "code", "description", "isActive", "zoneType",
      "capabilities", "priority", "capacity", "capacityUnit", "temperature", "humidity"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      data.distributionWarehouseId,
      data.name,
      data.code,
      data.description || null,
      data.isActive ?? true,
      data.zoneType,
      data.capabilities || null,
      data.priority ?? 0,
      data.capacity || null,
      data.capacityUnit || null,
      data.temperature || null,
      data.humidity || null
    ]
  );
}

async function updateZone(id: string, data: WarehouseZoneUpdateParams): Promise<DistributionWarehouseZone | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`"${key}" = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (updates.length === 0) return findZoneById(id);

  updates.push(`"updatedAt" = NOW()`);
  values.push(id);

  return queryOne<DistributionWarehouseZone>(
    `UPDATE "${ZONE_TABLE}" SET ${updates.join(', ')} WHERE "distributionWarehouseZoneId" = $${paramIndex} RETURNING *`,
    values
  );
}

async function deleteZone(id: string): Promise<boolean> {
  const result = await queryOne<{ distributionWarehouseZoneId: string }>(
    `DELETE FROM "${ZONE_TABLE}" WHERE "distributionWarehouseZoneId" = $1 RETURNING "distributionWarehouseZoneId"`,
    [id]
  );
  return !!result;
}

// =============================================================================
// Warehouse Bin Methods
// =============================================================================

async function findAllBins(warehouseId: string, filters: { zoneId?: string; isActive?: boolean; binType?: string } = {}): Promise<DistributionWarehouseBin[]> {
  const conditions: string[] = [`"distributionWarehouseId" = $1`];
  const values: any[] = [warehouseId];
  let paramIndex = 2;

  if (filters.zoneId) {
    conditions.push(`"distributionWarehouseZoneId" = $${paramIndex++}`);
    values.push(filters.zoneId);
  }

  if (filters.isActive !== undefined) {
    conditions.push(`"isActive" = $${paramIndex++}`);
    values.push(filters.isActive);
  }

  if (filters.binType) {
    conditions.push(`"binType" = $${paramIndex++}`);
    values.push(filters.binType);
  }

  const result = await query<DistributionWarehouseBin[]>(
    `SELECT * FROM "${BIN_TABLE}" WHERE ${conditions.join(' AND ')} ORDER BY "priority", "locationCode"`,
    values
  );
  return result || [];
}

async function findBinById(id: string): Promise<DistributionWarehouseBin | null> {
  return queryOne<DistributionWarehouseBin>(
    `SELECT * FROM "${BIN_TABLE}" WHERE "distributionWarehouseBinId" = $1`,
    [id]
  );
}

async function findBinByLocationCode(warehouseId: string, locationCode: string): Promise<DistributionWarehouseBin | null> {
  return queryOne<DistributionWarehouseBin>(
    `SELECT * FROM "${BIN_TABLE}" WHERE "distributionWarehouseId" = $1 AND "locationCode" = $2`,
    [warehouseId, locationCode]
  );
}

async function findPickableBins(warehouseId: string): Promise<DistributionWarehouseBin[]> {
  const result = await query<DistributionWarehouseBin[]>(
    `SELECT * FROM "${BIN_TABLE}" WHERE "distributionWarehouseId" = $1 AND "isPickable" = true AND "isActive" = true ORDER BY "priority"`,
    [warehouseId]
  );
  return result || [];
}

async function createBin(data: WarehouseBinCreateParams): Promise<DistributionWarehouseBin | null> {
  return queryOne<DistributionWarehouseBin>(
    `INSERT INTO "${BIN_TABLE}" (
      "distributionWarehouseId", "distributionWarehouseZoneId", "locationCode", "isActive",
      "binType", "height", "width", "depth", "maxVolume", "maxWeight",
      "isPickable", "isReceivable", "isMixed", "priority"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      data.distributionWarehouseId,
      data.distributionWarehouseZoneId || null,
      data.locationCode,
      data.isActive ?? true,
      data.binType,
      data.height || null,
      data.width || null,
      data.depth || null,
      data.maxVolume || null,
      data.maxWeight || null,
      data.isPickable ?? true,
      data.isReceivable ?? true,
      data.isMixed ?? true,
      data.priority ?? 0
    ]
  );
}

async function updateBin(id: string, data: WarehouseBinUpdateParams): Promise<DistributionWarehouseBin | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`"${key}" = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (updates.length === 0) return findBinById(id);

  updates.push(`"updatedAt" = NOW()`);
  values.push(id);

  return queryOne<DistributionWarehouseBin>(
    `UPDATE "${BIN_TABLE}" SET ${updates.join(', ')} WHERE "distributionWarehouseBinId" = $${paramIndex} RETURNING *`,
    values
  );
}

async function deleteBin(id: string): Promise<boolean> {
  const result = await queryOne<{ distributionWarehouseBinId: string }>(
    `DELETE FROM "${BIN_TABLE}" WHERE "distributionWarehouseBinId" = $1 RETURNING "distributionWarehouseBinId"`,
    [id]
  );
  return !!result;
}

// =============================================================================
// Named Exports (for controller compatibility)
// =============================================================================

// Warehouses
export async function findAllWarehouses(pagination?: { limit?: number; offset?: number }): Promise<{ warehouses: DistributionWarehouse[]; total: number }> {
  const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "${WAREHOUSE_TABLE}"`);
  const total = parseInt(countResult?.count || '0');
  
  let sql = `SELECT * FROM "${WAREHOUSE_TABLE}" ORDER BY "name"`;
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
  
  const warehouses = await query<DistributionWarehouse[]>(sql, params);
  return { warehouses: warehouses || [], total };
}

export async function findActiveWarehouses(): Promise<DistributionWarehouse[]> {
  return findAll({ isActive: true });
}

export const findWarehouseById = findById;
export const findWarehouseByCode = findByCode;
export const findDefaultWarehouse = findDefault;
export const createWarehouse = create;
export const updateWarehouse = update;
export { deleteWarehouse };

// =============================================================================
// Default Export (for backward compatibility)
// =============================================================================

export default {
  // Warehouses
  findAll,
  findById,
  findByCode,
  findDefault,
  findFulfillmentCenters,
  findReturnCenters,
  findNearestWarehouse,
  create,
  update,
  delete: deleteWarehouse,
  findAllWarehouses,
  findActiveWarehouses,
  findWarehouseById,
  findWarehouseByCode,
  findDefaultWarehouse,
  createWarehouse,
  updateWarehouse,

  // Zones
  findAllZones,
  findZoneById,
  findZoneByCode,
  createZone,
  updateZone,
  deleteZone,

  // Bins
  findAllBins,
  findBinById,
  findBinByLocationCode,
  findPickableBins,
  createBin,
  updateBin,
  deleteBin
};
