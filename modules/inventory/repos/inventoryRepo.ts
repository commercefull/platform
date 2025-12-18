/**
 * Inventory Repository
 * 
 * Handles persistence for inventory-related entities using the actual database schema.
 */

import { query, queryOne } from '../../../libs/db';
import { generateUUID } from '../../../libs/uuid';
import { 
  InventoryLocation as DbInventoryLocation,
  InventoryTransaction as DbInventoryTransaction,
  InventoryLevel as DbInventoryLevel,
  InventoryLot as DbInventoryLot,
  InventoryTransactionType as DbInventoryTransactionType,
  InventoryTransfer as DbInventoryTransfer,
  InventoryCount as DbInventoryCount
} from '../../../libs/db/types';

// ============================================================================
// Re-export types for external use
// ============================================================================

export type InventoryLocation = DbInventoryLocation;
export type InventoryTransaction = DbInventoryTransaction;
export type InventoryLevel = DbInventoryLevel;
export type InventoryLot = DbInventoryLot;
export type InventoryTransactionType = DbInventoryTransactionType;
export type InventoryTransfer = DbInventoryTransfer;
export type InventoryCount = DbInventoryCount;

// ============================================================================
// Input Types
// ============================================================================

export interface CreateInventoryLocationInput {
  distributionWarehouseId: string;
  distributionWarehouseBinId?: string;
  productId: string;
  productVariantId?: string;
  sku: string;
  quantity?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
  lotNumber?: string;
  serialNumber?: string;
  expiryDate?: Date;
  status?: string;
}

export interface UpdateInventoryLocationInput {
  quantity?: number;
  reservedQuantity?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
  status?: string;
}

export interface CreateInventoryTransactionInput {
  typeId: string;
  distributionWarehouseId: string;
  distributionWarehouseBinId?: string;
  productId: string;
  productVariantId?: string;
  sku: string;
  quantity: number;
  previousQuantity?: number;
  newQuantity?: number;
  referenceType?: string;
  referenceId?: string;
  lotNumber?: string;
  serialNumber?: string;
  notes?: string;
  reason?: string;
}

export interface InventoryLocationFilter {
  distributionWarehouseId?: string;
  productId?: string;
  sku?: string;
  status?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
}

// ============================================================================
// Repository
// ============================================================================

export class InventoryRepo {
  // ==========================================================================
  // Inventory Location Methods (Stock at specific warehouse locations)
  // ==========================================================================

  async findLocationById(inventoryLocationId: string): Promise<InventoryLocation | null> {
    const sql = `SELECT * FROM "inventoryLocation" WHERE "inventoryLocationId" = $1`;
    return await queryOne<InventoryLocation>(sql, [inventoryLocationId]);
  }

  async findLocationBySku(sku: string, distributionWarehouseId?: string): Promise<InventoryLocation | null> {
    let sql = `SELECT * FROM "inventoryLocation" WHERE "sku" = $1`;
    const params: unknown[] = [sku];

    if (distributionWarehouseId) {
      sql += ` AND "distributionWarehouseId" = $2`;
      params.push(distributionWarehouseId);
    }

    sql += ` LIMIT 1`;
    return await queryOne<InventoryLocation>(sql, params);
  }

  async findLocationsByProductId(productId: string): Promise<InventoryLocation[]> {
    const sql = `SELECT * FROM "inventoryLocation" WHERE "productId" = $1 ORDER BY "createdAt" DESC`;
    const results = await query<InventoryLocation[]>(sql, [productId]);
    return results || [];
  }

  async findLocationsByWarehouseId(distributionWarehouseId: string): Promise<InventoryLocation[]> {
    const sql = `SELECT * FROM "inventoryLocation" WHERE "distributionWarehouseId" = $1 ORDER BY "sku" ASC`;
    const results = await query<InventoryLocation[]>(sql, [distributionWarehouseId]);
    return results || [];
  }

  async findLocations(
    filter?: InventoryLocationFilter,
    limit: number = 50,
    offset: number = 0
  ): Promise<InventoryLocation[]> {
    let sql = `SELECT * FROM "inventoryLocation" WHERE 1=1`;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filter?.distributionWarehouseId) {
      sql += ` AND "distributionWarehouseId" = $${paramIndex}`;
      params.push(filter.distributionWarehouseId);
      paramIndex++;
    }

    if (filter?.productId) {
      sql += ` AND "productId" = $${paramIndex}`;
      params.push(filter.productId);
      paramIndex++;
    }

    if (filter?.sku) {
      sql += ` AND "sku" = $${paramIndex}`;
      params.push(filter.sku);
      paramIndex++;
    }

    if (filter?.status) {
      sql += ` AND "status" = $${paramIndex}`;
      params.push(filter.status);
      paramIndex++;
    }

    if (filter?.lowStock) {
      sql += ` AND "availableQuantity" <= "minimumStockLevel"`;
    }

    if (filter?.outOfStock) {
      sql += ` AND "availableQuantity" <= 0`;
    }

    sql += ` ORDER BY "updatedAt" DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const results = await query<InventoryLocation[]>(sql, params);
    return results || [];
  }

  async findLowStockLocations(): Promise<InventoryLocation[]> {
    const sql = `
      SELECT * FROM "inventoryLocation" 
      WHERE "availableQuantity" <= COALESCE("minimumStockLevel", 0)
      ORDER BY "availableQuantity" ASC
    `;
    const results = await query<InventoryLocation[]>(sql, []);
    return results || [];
  }

  async findOutOfStockLocations(): Promise<InventoryLocation[]> {
    const sql = `SELECT * FROM "inventoryLocation" WHERE "availableQuantity" <= 0 ORDER BY "sku" ASC`;
    const results = await query<InventoryLocation[]>(sql, []);
    return results || [];
  }

  async createLocation(input: CreateInventoryLocationInput): Promise<InventoryLocation> {
    const now = new Date();
    const quantity = input.quantity || 0;

    const sql = `
      INSERT INTO "inventoryLocation" (
        "distributionWarehouseId", "distributionWarehouseBinId", "productId", "productVariantId",
        "sku", "quantity", "reservedQuantity", "availableQuantity", "minimumStockLevel", "maximumStockLevel",
        "lotNumber", "serialNumber", "expiryDate", "status", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const result = await queryOne<InventoryLocation>(sql, [
      input.distributionWarehouseId,
      input.distributionWarehouseBinId || null,
      input.productId,
      input.productVariantId || null,
      input.sku,
      quantity,
      0, // reservedQuantity
      quantity, // availableQuantity
      input.minimumStockLevel || 0,
      input.maximumStockLevel || null,
      input.lotNumber || null,
      input.serialNumber || null,
      input.expiryDate || null,
      input.status || 'available',
      now,
      now
    ]);

    if (!result) {
      throw new Error('Failed to create inventory location');
    }

    return result;
  }

  async updateLocation(
    inventoryLocationId: string, 
    input: UpdateInventoryLocationInput
  ): Promise<InventoryLocation> {
    const now = new Date();
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (input.quantity !== undefined) {
      updates.push(`"quantity" = $${paramIndex}`);
      params.push(input.quantity);
      paramIndex++;
    }

    if (input.reservedQuantity !== undefined) {
      updates.push(`"reservedQuantity" = $${paramIndex}`);
      params.push(input.reservedQuantity);
      paramIndex++;
    }

    if (input.minimumStockLevel !== undefined) {
      updates.push(`"minimumStockLevel" = $${paramIndex}`);
      params.push(input.minimumStockLevel);
      paramIndex++;
    }

    if (input.maximumStockLevel !== undefined) {
      updates.push(`"maximumStockLevel" = $${paramIndex}`);
      params.push(input.maximumStockLevel);
      paramIndex++;
    }

    if (input.status !== undefined) {
      updates.push(`"status" = $${paramIndex}`);
      params.push(input.status);
      paramIndex++;
    }

    // Recalculate available quantity if quantity or reserved changed
    if (input.quantity !== undefined || input.reservedQuantity !== undefined) {
      updates.push(`"availableQuantity" = COALESCE($${paramIndex}, "quantity") - COALESCE($${paramIndex + 1}, "reservedQuantity")`);
      params.push(input.quantity ?? null, input.reservedQuantity ?? null);
      paramIndex += 2;
    }

    updates.push(`"updatedAt" = $${paramIndex}`);
    params.push(now);
    paramIndex++;

    params.push(inventoryLocationId);

    const sql = `
      UPDATE "inventoryLocation" 
      SET ${updates.join(', ')}
      WHERE "inventoryLocationId" = $${paramIndex}
      RETURNING *
    `;

    const result = await queryOne<InventoryLocation>(sql, params);
    if (!result) {
      throw new Error(`Inventory location ${inventoryLocationId} not found`);
    }

    return result;
  }

  async adjustQuantity(
    inventoryLocationId: string,
    quantityChange: number,
    reason?: string
  ): Promise<InventoryLocation> {
    const sql = `
      UPDATE "inventoryLocation" 
      SET 
        "quantity" = "quantity" + $2,
        "availableQuantity" = "availableQuantity" + $2,
        "updatedAt" = $3
      WHERE "inventoryLocationId" = $1
      RETURNING *
    `;

    const result = await queryOne<InventoryLocation>(sql, [
      inventoryLocationId,
      quantityChange,
      new Date()
    ]);

    if (!result) {
      throw new Error(`Inventory location ${inventoryLocationId} not found`);
    }

    return result;
  }

  async reserveQuantity(inventoryLocationId: string, quantity: number): Promise<InventoryLocation> {
    const sql = `
      UPDATE "inventoryLocation" 
      SET 
        "reservedQuantity" = "reservedQuantity" + $2,
        "availableQuantity" = "availableQuantity" - $2,
        "updatedAt" = $3
      WHERE "inventoryLocationId" = $1 AND "availableQuantity" >= $2
      RETURNING *
    `;

    const result = await queryOne<InventoryLocation>(sql, [
      inventoryLocationId,
      quantity,
      new Date()
    ]);

    if (!result) {
      throw new Error('Insufficient available quantity or location not found');
    }

    return result;
  }

  async releaseReservation(inventoryLocationId: string, quantity: number): Promise<InventoryLocation> {
    const sql = `
      UPDATE "inventoryLocation" 
      SET 
        "reservedQuantity" = GREATEST(0, "reservedQuantity" - $2),
        "availableQuantity" = "availableQuantity" + $2,
        "updatedAt" = $3
      WHERE "inventoryLocationId" = $1
      RETURNING *
    `;

    const result = await queryOne<InventoryLocation>(sql, [
      inventoryLocationId,
      quantity,
      new Date()
    ]);

    if (!result) {
      throw new Error(`Inventory location ${inventoryLocationId} not found`);
    }

    return result;
  }

  async deleteLocation(inventoryLocationId: string): Promise<boolean> {
    const sql = `DELETE FROM "inventoryLocation" WHERE "inventoryLocationId" = $1`;
    await query(sql, [inventoryLocationId]);
    return true;
  }

  // ==========================================================================
  // Inventory Transaction Methods
  // ==========================================================================

  async findTransactionById(inventoryTransactionId: string): Promise<InventoryTransaction | null> {
    const sql = `SELECT * FROM "inventoryTransaction" WHERE "inventoryTransactionId" = $1`;
    return await queryOne<InventoryTransaction>(sql, [inventoryTransactionId]);
  }

  async findTransactionsByProductId(productId: string, limit: number = 50): Promise<InventoryTransaction[]> {
    const sql = `
      SELECT * FROM "inventoryTransaction" 
      WHERE "productId" = $1 
      ORDER BY "createdAt" DESC 
      LIMIT $2
    `;
    const results = await query<InventoryTransaction[]>(sql, [productId, limit]);
    return results || [];
  }

  async findTransactionsByWarehouseId(
    distributionWarehouseId: string, 
    limit: number = 50
  ): Promise<InventoryTransaction[]> {
    const sql = `
      SELECT * FROM "inventoryTransaction" 
      WHERE "distributionWarehouseId" = $1 
      ORDER BY "createdAt" DESC 
      LIMIT $2
    `;
    const results = await query<InventoryTransaction[]>(sql, [distributionWarehouseId, limit]);
    return results || [];
  }

  async createTransaction(input: CreateInventoryTransactionInput): Promise<InventoryTransaction> {
    const now = new Date();

    const sql = `
      INSERT INTO "inventoryTransaction" (
        "typeId", "distributionWarehouseId", "distributionWarehouseBinId",
        "productId", "productVariantId", "sku", "quantity",
        "previousQuantity", "newQuantity", "referenceType", "referenceId",
        "lotNumber", "serialNumber", "notes", "status", "reason",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    const result = await queryOne<InventoryTransaction>(sql, [
      input.typeId,
      input.distributionWarehouseId,
      input.distributionWarehouseBinId || null,
      input.productId,
      input.productVariantId || null,
      input.sku,
      input.quantity,
      input.previousQuantity || null,
      input.newQuantity || null,
      input.referenceType || null,
      input.referenceId || null,
      input.lotNumber || null,
      input.serialNumber || null,
      input.notes || null,
      'completed',
      input.reason || null,
      now,
      now
    ]);

    if (!result) {
      throw new Error('Failed to create inventory transaction');
    }

    return result;
  }

  // ==========================================================================
  // Transaction Type Methods
  // ==========================================================================

  async findTransactionTypeByCode(code: string): Promise<InventoryTransactionType | null> {
    const sql = `SELECT * FROM "inventoryTransactionType" WHERE "code" = $1`;
    return await queryOne<InventoryTransactionType>(sql, [code]);
  }

  async findAllTransactionTypes(): Promise<InventoryTransactionType[]> {
    const sql = `SELECT * FROM "inventoryTransactionType" ORDER BY "name" ASC`;
    const results = await query<InventoryTransactionType[]>(sql, []);
    return results || [];
  }

  // ==========================================================================
  // Product Availability Methods
  // ==========================================================================

  async checkProductAvailability(
    productId: string, 
    variantId?: string, 
    requiredQuantity: number = 1
  ): Promise<{ available: boolean; totalAvailable: number; locations: InventoryLocation[] }> {
    let sql = `SELECT * FROM "inventoryLocation" WHERE "productId" = $1 AND "status" = 'available'`;
    const params: unknown[] = [productId];

    if (variantId) {
      sql += ` AND "productVariantId" = $2`;
      params.push(variantId);
    }

    const locations = await query<InventoryLocation[]>(sql, params);
    const locationList = locations || [];

    const totalAvailable = locationList.reduce((sum, loc) => sum + loc.availableQuantity, 0);

    return {
      available: totalAvailable >= requiredQuantity,
      totalAvailable,
      locations: locationList
    };
  }

  async getTotalStockForProduct(productId: string): Promise<number> {
    const sql = `
      SELECT COALESCE(SUM("availableQuantity"), 0) as total 
      FROM "inventoryLocation" 
      WHERE "productId" = $1 AND "status" = 'available'
    `;
    const result = await queryOne<{ total: string }>(sql, [productId]);
    return parseInt(result?.total || '0', 10);
  }

  // ==========================================================================
  // Inventory Level Methods (Aggregate stock levels)
  // ==========================================================================

  async findLevelById(inventoryLevelId: string): Promise<InventoryLevel | null> {
    const sql = `SELECT * FROM "inventoryLevel" WHERE "inventoryLevelId" = $1`;
    return await queryOne<InventoryLevel>(sql, [inventoryLevelId]);
  }

  async findLevelByProductAndWarehouse(
    productId: string, 
    distributionWarehouseId: string
  ): Promise<InventoryLevel | null> {
    const sql = `
      SELECT * FROM "inventoryLevel" 
      WHERE "productId" = $1 AND "distributionWarehouseId" = $2
    `;
    return await queryOne<InventoryLevel>(sql, [productId, distributionWarehouseId]);
  }
}

export default new InventoryRepo();
