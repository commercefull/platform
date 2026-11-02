/**
 * Inventory Repository Implementation (DDD)
 * PostgreSQL implementation for multi-location inventory management.
 *
 * @deprecated Use the pragmatic `inventoryRepo.ts` for new code.
 * This repository is maintained for backward compatibility with store dispatch use cases
 * that depend on the `Inventory` domain entity.
 */

import { query, queryOne } from '../../../../libs/db';
import { Inventory, InventoryLocation } from '../../domain/entities/Inventory';
import { InventoryLocation as DbInventoryLocation, DistributionWarehouse as DbDistributionWarehouse } from '../../../../libs/db/types';
import { PaginatedResult, PaginationOptions } from 'libs/types/pagination';
import { InventoryItemNotFoundError, FailedToCreateInventoryError, InventoryLocationNotFoundError } from '../../domain/errors/InventoryErrors';
import { getItemsNeedingReorder, getLowStockAlerts, getOutOfStockItems } from './inventoryAlertQueries';
import {
  createTransfer,
  getMovements,
  recordMovement,
  recordTransaction,
  type CreateTransferInput,
  type RecordTransactionInput,
} from './inventoryMovementQueries';
import { buildInventoryWhereClause, mapToInventory, mapToLocation } from './inventoryRowMappers';
import type { InventoryFilters } from './inventoryRowMappers';

export type { InventoryFilters };

export class InventoryRepository {
  // Inventory CRUD
  async findById(inventoryId: string): Promise<Inventory | null> {
    const row = await queryOne<DbInventoryLocation>('SELECT * FROM "inventoryLocation" WHERE "inventoryLocationId" = $1', [inventoryId]);

    if (!row) return null;
    return mapToInventory(row);
  }

  async findByStoreId(storeId: string): Promise<Inventory[]> {
    const location = await this.getLocationByStoreId(storeId);
    if (!location) {
      return [];
    }

    const result = await this.findAll({ locationId: location.locationId, isActive: true }, { limit: 1000, offset: 0 });
    return result.data;
  }

  async findByProductAndLocation(productId: string, locationId: string, variantId?: string): Promise<Inventory | null> {
    const row = await queryOne<DbInventoryLocation>(
      'SELECT * FROM "inventoryLocation" WHERE "productId" = $1 AND "distributionWarehouseId" = $2 AND "productVariantId" IS NOT DISTINCT FROM $3 AND "status" = \'available\'',
      [productId, locationId, variantId],
    );

    if (!row) return null;
    return mapToInventory(row);
  }

  async findBySku(sku: string, locationId?: string): Promise<Inventory[]> {
    let sql = 'SELECT * FROM "inventoryLocation" WHERE sku = $1 AND "status" = \'available\'';
    const params: unknown[] = [sku];

    if (locationId) {
      sql += ' AND "distributionWarehouseId" = $2';
      params.push(locationId);
    }

    const rows = await query<DbInventoryLocation[]>(sql, params);
    return (rows || []).map((row: DbInventoryLocation) => mapToInventory(row));
  }

  async findAll(filters?: InventoryFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Inventory>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDir = pagination?.orderDirection || 'desc';

    const { whereClause, params } = buildInventoryWhereClause(filters);

    const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "inventoryLocation" ${whereClause}`, params);
    const total = parseInt(countResult?.count || '0');

    const rows = await query<DbInventoryLocation[]>(
      `SELECT * FROM "inventoryLocation" ${whereClause}
       ORDER BY "${orderBy}" ${orderDir.toUpperCase()}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    const inventory = (rows || []).map((row: DbInventoryLocation) => mapToInventory(row));

    return {
      data: inventory,
      total,
      limit,
      offset,
      hasMore: offset + inventory.length < total,
      length: total,
    };
  }

  async save(inventory: Inventory): Promise<Inventory> {
    const now = new Date().toISOString();

    const existing = await queryOne<DbInventoryLocation>(
      'SELECT "inventoryLocationId" FROM "inventoryLocation" WHERE "inventoryLocationId" = $1',
      [inventory.inventoryId],
    );

    if (existing) {
      await query(
        `UPDATE "inventoryLocation" SET
          quantity = $1, "reservedQuantity" = $2, "availableQuantity" = $3,
          "minimumStockLevel" = $4, "expiryDate" = $5, "lotNumber" = $6,
          "status" = $7, "updatedAt" = $8
        WHERE "inventoryLocationId" = $9`,
        [
          inventory.quantity,
          inventory.reservedQuantity,
          inventory.availableQuantity,
          inventory.lowStockThreshold,
          inventory.expiryDate?.toISOString() || null,
          inventory.batchNumber || null,
          inventory.isActive ? 'available' : 'damaged',
          now,
          inventory.inventoryId,
        ],
      );
    } else {
      await query(
        `INSERT INTO "inventoryLocation" (
          "inventoryLocationId", "distributionWarehouseId", "productId", "productVariantId", sku,
          quantity, "reservedQuantity", "availableQuantity", "minimumStockLevel",
          "expiryDate", "lotNumber", "status", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          inventory.inventoryId,
          inventory.locationId,
          inventory.productId,
          inventory.variantId || null,
          inventory.sku,
          inventory.quantity,
          inventory.reservedQuantity,
          inventory.availableQuantity,
          inventory.lowStockThreshold,
          inventory.expiryDate?.toISOString() || null,
          inventory.batchNumber || null,
          inventory.isActive ? 'available' : 'damaged',
          now,
          now,
        ],
      );
    }

    return inventory;
  }

  async recordMovement(movement: Parameters<typeof recordMovement>[0]): ReturnType<typeof recordMovement> {
    return recordMovement(movement);
  }

  async getMovements(inventoryId: string, limit: number = 50): ReturnType<typeof getMovements> {
    return getMovements(inventoryId, limit);
  }

  // Inventory Locations (mapped to distributionWarehouse table)
  async getLocations(): Promise<InventoryLocation[]> {
    const rows = await query<DbDistributionWarehouse[]>(
      'SELECT * FROM "distributionWarehouse" WHERE "isActive" = true ORDER BY "isDefault" DESC, name ASC',
    );

    return (rows || []).map((row: DbDistributionWarehouse) => mapToLocation(row));
  }

  async getLocationById(locationId: string): Promise<InventoryLocation | null> {
    const row = await queryOne<DbDistributionWarehouse>('SELECT * FROM "distributionWarehouse" WHERE "distributionWarehouseId" = $1', [
      locationId,
    ]);

    if (!row) return null;
    return mapToLocation(row);
  }

  async findLocationById(locationId: string): Promise<InventoryLocation | null> {
    return this.getLocationById(locationId);
  }

  async getLocationByStoreId(storeId: string): Promise<InventoryLocation | null> {
    const row = await queryOne<DbDistributionWarehouse>(
      'SELECT * FROM "distributionWarehouse" WHERE "storeId" = $1 AND "isActive" = true ORDER BY "isDefault" DESC LIMIT 1',
      [storeId],
    );

    if (!row) return null;
    return mapToLocation(row);
  }

  // Stock calculations
  async getTotalStock(
    productId: string,
    variantId?: string,
  ): Promise<{
    totalQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    locations: number;
  }> {
    interface StockAggRow {
      totalQuantity: string | null;
      reservedQuantity: string | null;
      availableQuantity: string | null;
      locations: string | null;
    }

    const rows = await query<StockAggRow[]>(
      `SELECT
        SUM(quantity) as "totalQuantity",
        SUM("reservedQuantity") as "reservedQuantity",
        SUM("availableQuantity") as "availableQuantity",
        COUNT(*) as locations
      FROM "inventoryLocation"
      WHERE "productId" = $1 AND "productVariantId" IS NOT DISTINCT FROM $2 AND "status" = 'available'`,
      [productId, variantId],
    );

    const row = rows?.[0];
    return {
      totalQuantity: parseInt(row?.totalQuantity || '0'),
      reservedQuantity: parseInt(row?.reservedQuantity || '0'),
      availableQuantity: parseInt(row?.availableQuantity || '0'),
      locations: parseInt(row?.locations || '0'),
    };
  }

  getLowStockAlerts = getLowStockAlerts;
  getOutOfStockItems = getOutOfStockItems;
  getItemsNeedingReorder = getItemsNeedingReorder;

  // ==========================================================================
  // Item-level methods for TransferStock and CreateInventoryItem use cases
  // ==========================================================================

  async findByProduct(productId: string, variantId: string | undefined, locationId: string): Promise<Inventory | null> {
    return this.findByProductAndLocation(productId, locationId, variantId);
  }

  async updateQuantity(inventoryItemId: string, newQuantity: number): Promise<Inventory> {
    const now = new Date().toISOString();
    await query(
      `UPDATE "inventoryLocation" SET quantity = $1, "availableQuantity" = $1 - "reservedQuantity", "updatedAt" = $2 WHERE "inventoryLocationId" = $3`,
      [newQuantity, now, inventoryItemId],
    );

    const row = await queryOne<DbInventoryLocation>('SELECT * FROM "inventoryLocation" WHERE "inventoryLocationId" = $1', [
      inventoryItemId,
    ]);
    if (!row) throw new InventoryItemNotFoundError(inventoryItemId);
    return mapToInventory(row);
  }

  async create(input: {
    inventoryItemId: string;
    productId: string;
    variantId?: string;
    warehouseId: string;
    sku: string;
    quantity: number;
    reservedQuantity?: number;
    reorderPoint?: number;
    reorderQuantity?: number;
    binLocation?: string;
    costPrice?: number;
    metadata?: Record<string, unknown>;
  }): Promise<Inventory & { createdAt: Date }> {
    const now = new Date().toISOString();
    const available = input.quantity - (input.reservedQuantity || 0);
    // If binLocation is a human-readable code (e.g., 'A-1-2'), do not coerce into UUID column
    const binId = input.binLocation && /^[0-9a-fA-F-]{36}$/.test(input.binLocation) ? input.binLocation : null;

    await query(
      `INSERT INTO "inventoryLocation" (
        "inventoryLocationId", "distributionWarehouseId", "productId", "productVariantId", sku,
        quantity, "reservedQuantity", "availableQuantity", "minimumStockLevel",
        "distributionWarehouseBinId", "status", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'available', $11, $12)`,
      [
        input.inventoryItemId,
        input.warehouseId,
        input.productId,
        input.variantId || null,
        input.sku,
        input.quantity,
        input.reservedQuantity || 0,
        available,
        input.reorderPoint || 0,
        binId,
        now,
        now,
      ],
    );

    const row = await queryOne<DbInventoryLocation>('SELECT * FROM "inventoryLocation" WHERE "inventoryLocationId" = $1', [
      input.inventoryItemId,
    ]);
    if (!row) throw new FailedToCreateInventoryError('Failed to create inventory item');
    return mapToInventory(row) as Inventory & { createdAt: Date };
  }

  async recordTransaction(input: RecordTransactionInput): Promise<void> {
    return recordTransaction(input);
  }

  async findBySkuAndWarehouse(sku: string, warehouseId: string): Promise<Inventory | null> {
    const row = await queryOne<DbInventoryLocation>(
      `SELECT * FROM "inventoryLocation" WHERE sku = $1 AND "distributionWarehouseId" = $2 AND "status" = 'available'`,
      [sku, warehouseId],
    );
    if (!row) return null;
    return mapToInventory(row);
  }

  async findByProductAndWarehouse(productId: string, warehouseId: string, variantId?: string): Promise<Inventory | null> {
    return this.findByProductAndLocation(productId, warehouseId, variantId);
  }

  async count(filters?: InventoryFilters): Promise<number> {
    const { whereClause, params } = buildInventoryWhereClause(filters);
    const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "inventoryLocation" ${whereClause}`, params);
    return parseInt(countResult?.count || '0');
  }

  async getStats(
    filters?: InventoryFilters,
  ): Promise<{ totalItems: number; lowStockCount: number; outOfStockCount: number; totalValue?: number }> {
    interface StatsRow {
      totalItems: string | null;
      lowStockCount: string | null;
      outOfStockCount: string | null;
    }

    const { whereClause, params } = buildInventoryWhereClause(filters);
    const row = await queryOne<StatsRow>(
      `SELECT
        COUNT(*) as "totalItems",
        COUNT(*) FILTER (WHERE "availableQuantity" > 0 AND "availableQuantity" <= COALESCE("minimumStockLevel", 0)) as "lowStockCount",
        COUNT(*) FILTER (WHERE "availableQuantity" <= 0) as "outOfStockCount"
      FROM "inventoryLocation" ${whereClause}`,
      params,
    );
    return {
      totalItems: parseInt(row?.totalItems || '0'),
      lowStockCount: parseInt(row?.lowStockCount || '0'),
      outOfStockCount: parseInt(row?.outOfStockCount || '0'),
    };
  }

  async getAvailableQuantity(storeId: string, productId: string, variantId?: string): Promise<number> {
    const location = await this.getLocationByStoreId(storeId);
    if (!location) return 0;
    const inv = await this.findByProductAndLocation(productId, location.locationId, variantId);
    return inv ? inv.availableQuantity : 0;
  }

  async reserveForTransfer(
    storeId: string,
    productId: string,
    variantId: string | undefined,
    quantity: number,
    _transferId: string,
  ): Promise<void> {
    const location = await this.getLocationByStoreId(storeId);
    if (!location) throw new InventoryLocationNotFoundError(storeId);
    const inv = await this.findByProductAndLocation(productId, location.locationId, variantId);
    if (!inv) throw new InventoryItemNotFoundError(productId);
    const now = new Date().toISOString();
    await query(
      `UPDATE "inventoryLocation" SET "reservedQuantity" = "reservedQuantity" + $1, "availableQuantity" = "availableQuantity" - $1, "updatedAt" = $2 WHERE "inventoryLocationId" = $3`,
      [quantity, now, inv.inventoryId],
    );
  }

  async createTransfer(
    input: CreateTransferInput,
  ): Promise<{ transferId: string; sourceStoreId: string; targetStoreId: string; status: string; createdAt: Date }> {
    return createTransfer(input);
  }

  async updateReorderPoint(inventoryItemId: string, reorderPoint: number, _reorderQuantity?: number): Promise<void> {
    const now = new Date().toISOString();
    await query(`UPDATE "inventoryLocation" SET "minimumStockLevel" = $1, "updatedAt" = $2 WHERE "inventoryLocationId" = $3`, [
      reorderPoint,
      now,
      inventoryItemId,
    ]);
  }
}

export default new InventoryRepository();
