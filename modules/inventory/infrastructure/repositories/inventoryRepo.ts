/**
 * Inventory Repository
 *
 * Handles persistence for inventory-related entities using the actual database schema.
 */

import { query, queryOne } from '../../../../libs/db';
import {
  InventoryLocation as DbInventoryLocation,
  InventoryTransaction as DbInventoryTransaction,
  InventoryLevel as DbInventoryLevel,
  InventoryTransactionType as DbInventoryTransactionType,
} from '../../../../libs/db/types';
import { InventoryLocationNotFoundError, FailedToCreateInventoryError, InsufficientStockError } from '../../domain/errors/InventoryErrors';
import { InventoryAvailabilityRepo } from './inventoryAvailabilityRepo';
import { InventoryReservationRepo } from './inventoryReservationQueries';

// ============================================================================
// Re-export types for external use
// ============================================================================

export type InventoryLocation = DbInventoryLocation;
type InventoryTransaction = DbInventoryTransaction;
type InventoryLevel = DbInventoryLevel;
type InventoryTransactionType = DbInventoryTransactionType;

// ============================================================================
// Input Types
// ============================================================================

interface CreateInventoryLocationInput {
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

interface UpdateInventoryLocationInput {
  quantity?: number;
  reservedQuantity?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
  status?: string;
}

interface CreateInventoryTransactionInput {
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

/** AND-joined filter clauses for `findLocations`, with positional params. */
function locationFilterClauses(filter?: InventoryLocationFilter): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  const addEquality = (column: string, value?: string) => {
    if (!value) return;
    conditions.push(` AND ${column} = $${params.length + 1}`);
    params.push(value);
  };

  addEquality('"distributionWarehouseId"', filter?.distributionWarehouseId);
  addEquality('"productId"', filter?.productId);
  addEquality('"sku"', filter?.sku);
  addEquality('"status"', filter?.status);
  if (filter?.lowStock) conditions.push(` AND "availableQuantity" <= "minimumStockLevel"`);
  if (filter?.outOfStock) conditions.push(` AND "availableQuantity" <= 0`);

  return { clause: conditions.join(''), params };
}

interface InventoryLocationFilter {
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

class InventoryRepo {
  private readonly availability = new InventoryAvailabilityRepo();
  private readonly reservations = new InventoryReservationRepo();

  // ==========================================================================
  // Inventory Location Methods (Stock at specific warehouse locations)
  // ==========================================================================

  async findLocationById(inventoryLocationId: string): Promise<InventoryLocation | null> {
    const sql = `SELECT * FROM "inventoryLocation" WHERE "inventoryLocationId" = $1`;
    return await queryOne<DbInventoryLocation>(sql, [inventoryLocationId]);
  }

  async findLocationBySku(sku: string, distributionWarehouseId?: string): Promise<InventoryLocation | null> {
    let sql = `SELECT * FROM "inventoryLocation" WHERE "sku" = $1`;
    const params: unknown[] = [sku];

    if (distributionWarehouseId) {
      sql += ` AND "distributionWarehouseId" = $2`;
      params.push(distributionWarehouseId);
    }

    sql += ` LIMIT 1`;
    return await queryOne<DbInventoryLocation>(sql, params);
  }

  async findLocationsByProductId(productId: string): Promise<InventoryLocation[]> {
    const sql = `SELECT * FROM "inventoryLocation" WHERE "productId" = $1 ORDER BY "createdAt" DESC`;
    const results = await query<DbInventoryLocation[]>(sql, [productId]);
    return results || [];
  }

  async findLocationsByWarehouseId(distributionWarehouseId: string): Promise<InventoryLocation[]> {
    const sql = `SELECT * FROM "inventoryLocation" WHERE "distributionWarehouseId" = $1 ORDER BY "sku" ASC`;
    const results = await query<DbInventoryLocation[]>(sql, [distributionWarehouseId]);
    return results || [];
  }

  async findLocations(filter?: InventoryLocationFilter, limit: number = 50, offset: number = 0): Promise<InventoryLocation[]> {
    const { clause, params } = locationFilterClauses(filter);

    const sql =
      `SELECT * FROM "inventoryLocation" WHERE 1=1${clause}` +
      ` ORDER BY "updatedAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const results = await query<DbInventoryLocation[]>(sql, params);
    return results || [];
  }

  async findLowStockLocations(): Promise<InventoryLocation[]> {
    const sql = `
      SELECT * FROM "inventoryLocation" 
      WHERE "availableQuantity" <= COALESCE("minimumStockLevel", 0)
      ORDER BY "availableQuantity" ASC
    `;
    const results = await query<DbInventoryLocation[]>(sql, []);
    return results || [];
  }

  async findOutOfStockLocations(): Promise<InventoryLocation[]> {
    const sql = `SELECT * FROM "inventoryLocation" WHERE "availableQuantity" <= 0 ORDER BY "sku" ASC`;
    const results = await query<DbInventoryLocation[]>(sql, []);
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

    const result = await queryOne<DbInventoryLocation>(sql, [
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
      now,
    ]);

    if (!result) {
      throw new FailedToCreateInventoryError('Failed to create inventory location');
    }

    return result;
  }

  async updateLocation(inventoryLocationId: string, input: UpdateInventoryLocationInput): Promise<InventoryLocation> {
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

    const result = await queryOne<DbInventoryLocation>(sql, params);
    if (!result) {
      throw new InventoryLocationNotFoundError(inventoryLocationId);
    }

    return result;
  }

  /**
   * Atomically reserve stock on a location row under SELECT ... FOR UPDATE.
   * Returns the actually-applied reservation delta (clamped at available
   * stock for tracked items, full delta when `allowBackorder`), or null when
   * the location row does not exist. Prevents overselling under concurrent
   * checkouts that would otherwise race a check-then-act read.
   */
  async reserveLocationAtomic(
    inventoryLocationId: string,
    delta: number,
    allowBackorder: boolean,
  ): Promise<{ appliedQuantity: number; quantity: number; reservedQuantity: number; availableQuantity: number } | null> {
    const row = await queryOne<Record<string, unknown>>(
      `WITH locked AS (
         SELECT "inventoryLocationId", "quantity", "reservedQuantity"
         FROM "inventoryLocation"
         WHERE "inventoryLocationId" = $1
         FOR UPDATE
       ), upd AS (
         UPDATE "inventoryLocation" l
         SET "reservedQuantity" = l."reservedQuantity" + (
               CASE WHEN $3 THEN $2 ELSE GREATEST(0, LEAST($2, locked."quantity" - locked."reservedQuantity")) END
             ),
             "availableQuantity" = l."quantity" - (l."reservedQuantity" + (
               CASE WHEN $3 THEN $2 ELSE GREATEST(0, LEAST($2, locked."quantity" - locked."reservedQuantity")) END
             )),
             "updatedAt" = now()
         FROM locked
         WHERE l."inventoryLocationId" = locked."inventoryLocationId"
         RETURNING locked."quantity", locked."reservedQuantity" AS "oldReserved", l."reservedQuantity" AS "newReserved"
       )
       SELECT "quantity", "oldReserved", "newReserved" FROM upd`,
      [inventoryLocationId, delta, allowBackorder],
    );
    if (!row) return null;
    const newReserved = Number(row.newReserved);
    const quantity = Number(row.quantity);
    return {
      appliedQuantity: newReserved - Number(row.oldReserved),
      quantity,
      reservedQuantity: newReserved,
      availableQuantity: quantity - newReserved,
    };
  }

  async adjustQuantity(inventoryLocationId: string, quantityChange: number, _reason?: string): Promise<InventoryLocation> {
    const sql = `
      UPDATE "inventoryLocation" 
      SET 
        "quantity" = "quantity" + $2,
        "availableQuantity" = "availableQuantity" + $2,
        "updatedAt" = $3
      WHERE "inventoryLocationId" = $1
      RETURNING *
    `;

    const result = await queryOne<DbInventoryLocation>(sql, [inventoryLocationId, quantityChange, new Date()]);

    if (!result) {
      throw new InventoryLocationNotFoundError(inventoryLocationId);
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

    const result = await queryOne<DbInventoryLocation>(sql, [inventoryLocationId, quantity, new Date()]);

    if (!result) {
      throw new InsufficientStockError(inventoryLocationId, quantity, 0);
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

    const result = await queryOne<DbInventoryLocation>(sql, [inventoryLocationId, quantity, new Date()]);

    if (!result) {
      throw new InventoryLocationNotFoundError(inventoryLocationId);
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
    return await queryOne<DbInventoryTransaction>(sql, [inventoryTransactionId]);
  }

  async findTransactionsByProductId(productId: string, limit: number = 50): Promise<InventoryTransaction[]> {
    const sql = `
      SELECT * FROM "inventoryTransaction" 
      WHERE "productId" = $1 
      ORDER BY "createdAt" DESC 
      LIMIT $2
    `;
    const results = await query<DbInventoryTransaction[]>(sql, [productId, limit]);
    return results || [];
  }

  async findTransactionsByWarehouseId(distributionWarehouseId: string, limit: number = 50): Promise<InventoryTransaction[]> {
    const sql = `
      SELECT * FROM "inventoryTransaction" 
      WHERE "distributionWarehouseId" = $1 
      ORDER BY "createdAt" DESC 
      LIMIT $2
    `;
    const results = await query<DbInventoryTransaction[]>(sql, [distributionWarehouseId, limit]);
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

    const result = await queryOne<DbInventoryTransaction>(sql, [
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
      now,
    ]);

    if (!result) {
      throw new FailedToCreateInventoryError('Failed to create inventory transaction');
    }

    return result;
  }

  // ==========================================================================
  // Transaction Type Methods
  // ==========================================================================

  async findTransactionTypeByCode(code: string): Promise<InventoryTransactionType | null> {
    const sql = `SELECT * FROM "inventoryTransactionType" WHERE "code" = $1`;
    return await queryOne<DbInventoryTransactionType>(sql, [code]);
  }

  async findAllTransactionTypes(): Promise<InventoryTransactionType[]> {
    const sql = `SELECT * FROM "inventoryTransactionType" ORDER BY "name" ASC`;
    const results = await query<DbInventoryTransactionType[]>(sql, []);
    return results || [];
  }

  // ==========================================================================
  // Product Availability Methods
  // ==========================================================================

  checkProductAvailability = (productId: string, variantId?: string, requiredQuantity: number = 1) =>
    this.availability.checkProductAvailability(productId, variantId, requiredQuantity);
  findAvailableQuantityAtWarehouse = (distributionWarehouseId: string, productId: string, variantId?: string) =>
    this.availability.findAvailableQuantityAtWarehouse(distributionWarehouseId, productId, variantId);
  findLocationsByStoreProduct = (storeId: string, productId: string, variantId?: string) =>
    this.availability.findLocationsByStoreProduct(storeId, productId, variantId);
  getTotalStockForProduct = (productId: string) => this.availability.getTotalStockForProduct(productId);

  // ==========================================================================
  // Inventory Level Methods (Aggregate stock levels)
  // ==========================================================================

  async findLevelById(inventoryLevelId: string): Promise<InventoryLevel | null> {
    const sql = `SELECT * FROM "inventoryLevel" WHERE "inventoryLevelId" = $1`;
    return await queryOne<DbInventoryLevel>(sql, [inventoryLevelId]);
  }

  async findLevelByProductAndWarehouse(productId: string, distributionWarehouseId: string): Promise<InventoryLevel | null> {
    const sql = `
      SELECT * FROM "inventoryLevel" 
      WHERE "productId" = $1 AND "distributionWarehouseId" = $2
    `;
    return await queryOne<DbInventoryLevel>(sql, [productId, distributionWarehouseId]);
  }

  // ==========================================================================
  // Reservation Methods
  // ==========================================================================

  createReservation = (input: Parameters<InventoryReservationRepo['createReservation']>[0]) => this.reservations.createReservation(input);
  findReservationById = (reservationId: string) => this.reservations.findReservationById(reservationId);
  findReservationsByOrderId = (orderId: string) => this.reservations.findReservationsByOrderId(orderId);
  attachReservationsToOrderItem = (orderId: string, productId: string, variantId: string | undefined, orderItemId: string) =>
    this.reservations.attachReservationsToOrderItem(orderId, productId, variantId, orderItemId);
  updateReservationStatus = (reservationId: string, status: string, reason?: string) =>
    this.reservations.updateReservationStatus(reservationId, status, reason);

  // ==========================================================================
  // Reorder Point / Threshold Methods
  // ==========================================================================

  async updateReorderPoint(inventoryItemId: string, reorderPoint: number, _reorderQuantity?: number): Promise<void> {
    const now = new Date();
    await query(`UPDATE "inventoryLocation" SET "minimumStockLevel" = $1, "updatedAt" = $2 WHERE "inventoryLocationId" = $3`, [
      reorderPoint,
      now,
      inventoryItemId,
    ]);
  }
}

export default new InventoryRepo();
